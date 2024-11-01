import { EventEmitter } from 'events';
import * as Sentry from '@sentry/node';
import config from '../config';
import { type Unleash } from 'unleash-client';
import { serverLogger } from '@pocket-tools/ts-logger';
import { QueueHandler } from './queueHandler';
import { ImportMapping, ImportMessage, QueueConfig } from './types';
import { getClient } from '../featureFlags';
import { SavedItemImportInput } from '../types';
import gql from 'graphql-tag';
import { print } from 'graphql';

/**
 * A slightly silly config to override a value conditionally
 * with a feature flag
 */
class ImportHandlerQueueConfig implements QueueConfig {
  batchSize: number;
  url: string;
  visibilityTimeout: number;
  maxMessages: number;
  waitTimeSeconds: number;
  messageRetentionSeconds: number;
  defaultPollIntervalSeconds: number;
  name: string;
  constructor(
    private config: QueueConfig,
    private unleash: Unleash,
    private overrides: {
      afterMessagePollIntervalSeconds: string;
    },
  ) {
    this.batchSize = config.batchSize;
    this.url = config.url;
    this.visibilityTimeout = config.visibilityTimeout;
    this.maxMessages = config.maxMessages;
    this.waitTimeSeconds = config.waitTimeSeconds;
    this.messageRetentionSeconds = config.messageRetentionSeconds;
    this.name = config.name;
    this.defaultPollIntervalSeconds = config.defaultPollIntervalSeconds;
  }
  private variantOrDefault(flag: string, defaultValue: number) {
    const variant = this.unleash.getVariant(flag);
    if (variant.payload != null) {
      if (variant.payload.type === 'number') {
        return parseFloat(variant.payload.value);
      }
    }
    return defaultValue;
  }
  get afterMessagePollIntervalSeconds(): number {
    return this.variantOrDefault(
      this.overrides.afterMessagePollIntervalSeconds,
      this.config.afterMessagePollIntervalSeconds,
    );
  }
}

type ImportFunctionMap<T extends keyof ImportMapping> = {
  [key in T]: (
    message: ImportMessage<T>['records'],
  ) => Promise<Array<SavedItemImportInput>>;
};

export class BatchImportHandler extends QueueHandler {
  // If you add a new importer, update the mapping here
  importMap: ImportFunctionMap<'omnivore'> = {
    omnivore: this.fromOmnivore,
  };
  private oldPollQueue: () => Promise<void>;
  /**
   * Class for deleting records in batches from the database,
   * when a user deletes their account. Consumes messages from
   * the BatchDelete SQS queue in a synchronous, blocking way;
   * only picks up a new message when the previous one has been
   * completed (or had error), after a delay. If not actively
   * processing messages, polls the queue on a schedule to discover
   * messages.
   * Queue polling starts by deafult
   * once the class is instantiated and continues
   * on a schedule.
   * @param emitter The EventEmitter used by the class for scheduling
   * poll events
   * @param pollOnInit whether to start polling when the class is
   * instantiated, primarily for testing (default=true);
   * @param unleashClient optional unleash client, intended
   * to use mock for testing. Otherwise will pull in the globally
   * initialized unleash instance. Can consider DI here and elsewhere
   * in the future.
   */
  constructor(
    public readonly emitter: EventEmitter,
    pollOnInit = true,
    unleashClient?: Unleash,
  ) {
    const _unleashClient = unleashClient ?? getClient();
    const queueConfig = new ImportHandlerQueueConfig(
      config.aws.sqs.batchImportQueue,
      _unleashClient,
      {
        afterMessagePollIntervalSeconds:
          'perm.backend.batch-import-poll-interval',
      },
    );
    super(emitter, 'pollBatchImport', queueConfig, pollOnInit, unleashClient);
    this.oldPollQueue = super.pollQueue;
    this.pollQueue = this.pollQueueHook;
  }

  /**
   * Hook into the pollQueue method to short-circuit it if
   * killswitch is on; do nothing and schedule next poll (since
   * it could be turned back on)
   * @returns
   */
  private async pollQueueHook() {
    // The unleash client is configured to check for new
    // values every handful of seconds, so if this value
    // is changed subsequent polls of the queue will pick it up
    if (
      this.unleashClient.isEnabled(
        config.unleash.flags.importDisabled.name,
        undefined,
        config.unleash.flags.importDisabled.fallback,
      )
    ) {
      serverLogger.debug(
        `Skipping polling of ${config.aws.sqs.batchImportQueue.url} due to feature flag kill switch on.`,
      );
      // Schedule next poll and do nothing else
      await this.scheduleNextPoll(
        config.aws.sqs.batchImportQueue.defaultPollIntervalSeconds * 1000,
      );
      return;
    }
    // Continue to poll the queue if killswitch not hit
    await this.oldPollQueue();
  }

  /**
   * Handle messages from the batchImport queue. Loads data from
   * import messages in batches into the database.
   * @param body the body of the SQS message in the BatchDelete queue
   * @returns whether or not the message was successfully handled
   * (underlying call to AccountDeleteDataService completed without error)
   */
  async handleMessage<T extends keyof ImportMapping>(
    body: ImportMessage<T>,
  ): Promise<boolean> {
    try {
      const inserts = await this.getImporter(body);
      return await this.makeRequest(body.userId.toString(), inserts);
    } catch (error) {
      serverLogger.error({
        message:
          'Error encountered while handling import. Returning message to the queue',
        errorData: error,
        request: body,
        errorMessage: error.message,
      });
      // Underlying services handle logging and observability of their errors
      return false;
    }
  }

  async makeRequest(userId: string, records: SavedItemImportInput[]) {
    // Minimally
    const headers = {
      'Content-Type': 'application/json',
      userid: userId,
      apiId: '0', // TODO: placeholder
    };
    const query = gql`
      mutation batchImport($input: [BatchImportInput!]!) {
        batchImport(input: $input)
      }
    `;
    const variables = { input: records };
    const result = await fetch(`http://localhost:${config.app.port}/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: print(query), variables }),
    });
    const data = await result.json();
    if (data['errors']?.length || data['data']?.batchImport == null) {
      return false;
    } else {
      return data['data']['batchImport'];
    }
  }

  /**
   * Fetch the importer from the mapping defined in the class above
   * TODO: Can consider moving this plus validation to the ingester so
   * so we always have a consistent message schema.
   * @param name the name of the importer to use
   * @throws error if no entry is found in the mapping
   */
  getImporter<T extends keyof ImportMapping>(
    body: ImportMessage<T>,
  ): Promise<Array<SavedItemImportInput>> {
    if (this.importMap[body.importer] == null) {
      const message = 'Attempted to import from unrecognized format';
      serverLogger.error({ message, importer: body.importer });
      Sentry.captureException(message, { data: { importer: body.importer } });
      throw new Error(message);
    } else {
      return this.importMap[body.importer](body.records);
    }
  }
  /**
   * Prepare records from omnivore exports to ingest into Pocket
   * @param records omnivore export records batch
   * @returns records for ingesting into Pocket list-related dbs
   * @throws Underlying parser error if unable to hydrate record
   * or if parser item was malformed
   */
  private async fromOmnivore(
    records: ImportMessage<'omnivore'>['records'],
  ): Promise<Array<SavedItemImportInput>> {
    return records.map((record) => ({
      url: record.url,
      createdAt: record.savedAt,
      title: record.title,
      status: record.state === 'Active' ? 'UNREAD' : 'ARCHIVED',
      tags: record.labels,
    }));
  }
}
