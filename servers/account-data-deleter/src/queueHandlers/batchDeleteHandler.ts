import { EventEmitter } from 'events';
import * as Sentry from '@sentry/node';
import { config } from '../config';
import { SqsMessage } from '../routes/queueDelete';
import { nanoid } from 'nanoid';
import { writeClient } from '../dataService/clients';
import { AccountDeleteDataService } from '../dataService/accountDeleteDataService';
import { type Unleash } from 'unleash-client';
import { serverLogger } from '@pocket-tools/ts-logger';
import { QueueHandler } from './queueHandler';

export class BatchDeleteHandler extends QueueHandler {
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
    super(
      emitter,
      'pollBatchDelete',
      config.aws.sqs.accountDeleteQueue,
      pollOnInit,
      unleashClient,
    );
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
        config.unleash.flags.deletesDisabled.name,
        undefined,
        config.unleash.flags.deletesDisabled.fallback,
      )
    ) {
      serverLogger.info(
        `Skipping polling of ${config.aws.sqs.accountDeleteQueue.url} due to feature flag kill switch on.`,
      );
      // Schedule next poll and do nothing else
      await this.scheduleNextPoll(
        config.aws.sqs.accountDeleteQueue.defaultPollIntervalSeconds * 1000,
      );
      return;
    }
    // Continue to poll the queue if killswitch not hit
    await this.oldPollQueue();
  }

  /**
   * Handle messages from the batchDelete queue. Calls
   * AccountDeleteDataService and forwards any errors to
   * Cloudwatch and Sentry.
   * @param body the body of the SQS message in the BatchDelete queue
   * @returns whether or not the message was successfully handled
   * (underlying call to AccountDeleteDataService completed without error)
   */
  async handleMessage(body: SqsMessage): Promise<boolean> {
    const traceId = body.traceId ?? nanoid();
    const limitOverridesConfig = config.queueDelete.limitOverrides;

    // Kick off promises for deletes, but don't block response
    try {
      serverLogger.info({
        message: 'handleMessage: Starting deletes.',
        request: {
          traceId: traceId,
          body: body,
        },
      });
      await new AccountDeleteDataService(
        body.userId,
        writeClient(),
      ).batchDeleteUserInformation(
        body.tableName,
        {
          primaryKeyNames: body.primaryKeyNames,
          primaryKeyValues: body.primaryKeyValues,
        },
        traceId,
        limitOverridesConfig,
      );

      await this.handleSpecialDeletes(body, traceId);
    } catch (error) {
      const errorMessage =
        'handleMessage: Error occurred during batch delete query';
      serverLogger.error({
        message: errorMessage,
        error: error,
        request: body,
      });
      Sentry.addBreadcrumb({
        message: errorMessage,
        data: body,
      });
      Sentry.captureException(error);
      return false;
    }
    return true;
  }

  /***
   * handles table specific delete logic
   * @param body
   * @param traceId
   */
  async handleSpecialDeletes(body: SqsMessage, traceId: string) {
    const limitOverridesConfig = config.queueDelete.limitOverrides;

    try {
      if (body.tableName === 'readitla_ril-tmp.campaign_target') {
        //`id`s are same for both tables.
        //select * from `readitla_ril-tmp`.campaign_target_vars ctv
        //join `readitla_ril-tmp`.campaign_target ct
        // on ctv.id = ct.id limit 100;
        //https://github.com/Pocket/Web/blob/6c36eade3f367b616da3d3099fee5d422ac86404/classes/NotificationQueue.php#L322
        await new AccountDeleteDataService(
          body.userId,
          writeClient(),
        ).batchDeleteUserInformation(
          'readitla_ril-tmp.campaign_target_vars',
          {
            primaryKeyNames: body.primaryKeyNames,
            primaryKeyValues: body.primaryKeyValues,
          },
          traceId,
          limitOverridesConfig,
        );
      }
    } catch (error) {
      const errorMessage =
        'handleSpecialDeletes: Error occurred during batch delete query';
      serverLogger.error({ message: errorMessage, error: error, data: body });
      Sentry.addBreadcrumb({
        message: errorMessage,
        data: body,
      });
      Sentry.captureException(error);
      return false;
    }
    return true;
  }
}
