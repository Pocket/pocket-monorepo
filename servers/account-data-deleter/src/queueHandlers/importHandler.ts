import { EventEmitter } from 'events';
import { config } from '../config';
import { type Unleash } from 'unleash-client';
import { S3Bucket, QueuePoller } from '@pocket-tools/aws-utils';
import { serverLogger } from '@pocket-tools/ts-logger';
import { OmnivoreImporter } from '../dataService/importers/OmnivoreImport';
import * as Sentry from '@sentry/node';
import { ImportBase } from '../dataService/importers/ImportBase';
import { unleash } from '../unleash';
import { sqs } from '../aws/sqs';

/**
 * This isn't everything but it's what we care about
 * I can't find appropriate types for this event
 */
type SqsS3EventRecord = {
  eventName: string; // like ObjectCreated:Put
  s3: {
    bucket: {
      name: string;
    };
    object: {
      key: string;
    };
  };
};

type SqsMessage = { Records: SqsS3EventRecord[] };

export class ImportListHandler extends QueuePoller<SqsMessage> {
  // If you add a new importer, update the mapping here
  importMap = {
    omnivore: OmnivoreImporter,
  };
  unleashClient: Unleash;
  private oldPollQueue: () => Promise<void>;
  /**
   * Class for importing a Pocket User's list in batches from the
   * database, when a user uploads a file to an S3 bucket with the
   * presigned url provided by the list-api importPresignedUrl mutation.
   * When it picks up a message, which is sent when a file is uploaded,
   * it loads the file into a series of messages for the list-api to
   * consume to actually complete the import.
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
    const _unleashClient = unleashClient ?? unleash();
    super(
      { emitter, eventName: 'pollListImport' },
      { config: config.aws.sqs.importFileQueue, client: sqs },
      { pollOnInit },
    );
    this.oldPollQueue = super.pollQueue;
    this.pollQueue = this.pollQueueHook;
    this.unleashClient = _unleashClient;
  }

  /**
   * Handle messages from the ListExport queue.
   * @param body the body of the SQS message in the ListExport queue,
   * which is actually JSON-stringified body of another message...
   * @returns whether or not the message was successfully handled
   * (underlying call to AccountDeleteDataService completed without error)
   */
  async handleMessage(message: {
    Records: SqsS3EventRecord[];
  }): Promise<boolean> {
    serverLogger.info({
      message: 'ImportListHandler - received request',
      body: message,
    });
    try {
      // Shouldn't ever happen per aws event contract but log it
      if (message.Records.length !== 1) {
        serverLogger.error({
          message: 'Unexpected number of records -- truncating',
          records: message.Records,
        });
        Sentry.captureException('Truncating file import message Records');
      }
      const record = message.Records[0];
      const importer = this.getImporter(
        record.s3.object.key,
        record.s3.bucket.name,
      );
      await importer.start();
    } catch (error) {
      serverLogger.error({
        message:
          'Error encountered while handling import. Returning message to the queue',
        errorData: error,
        request: message,
        errorMessage: error.message,
      });
      // Underlying services handle logging and observability of their errors
      return false;
    }
    return true;
  }

  private async pollQueueHook() {
    // The unleash client is configured to check for new
    // values every handful of seconds, so if this value
    // is changed subsequent polls of the queue will pick it up
    if (
      this.unleashClient.isEnabled(
        config.unleash.flags.importsDisabled.name,
        undefined,
        config.unleash.flags.importsDisabled.fallback,
      )
    ) {
      serverLogger.debug(
        `Skipping polling of ${config.aws.sqs.importFileQueue.url} due to feature flag kill switch on.`,
      );
      // Schedule next poll and do nothing else
      await this.scheduleNextPoll(
        config.aws.sqs.importFileQueue.defaultPollIntervalSeconds * 1000,
      );
      return;
    }
    // Continue to poll the queue if killswitch not hit
    await this.oldPollQueue();
  }

  /**
   * For adding a new importer, you'll need to update the mapping here
   * @param name the name of the importer to use
   * @throws error if no entry is found in the mapping
   */
  getImporter<T extends ImportBase>(key: string, bucket: string): T {
    // The format of the file key is '<userid>/<application>/<filekey>
    const application = key.split('/')[1];
    if (this.importMap[application] == null) {
      const message = 'Unable to find importer for file';
      serverLogger.error({ message, application });
      Sentry.captureException(message, { data: application });
      throw new Error(message);
    } else {
      const s3bucket = new S3Bucket(bucket, {
        region: config.aws.region,
        endpoint: config.aws.endpoint,
      });
      return new this.importMap[application](s3bucket, key, this.sqs.client);
    }
  }
}
