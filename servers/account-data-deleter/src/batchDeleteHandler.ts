import { EventEmitter } from 'events';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommandOutput,
} from '@aws-sdk/client-sqs';
import * as Sentry from '@sentry/node';
import { config } from './config/index.js';
import { SqsMessage } from './routes/queueDelete.js';
import { nanoid } from 'nanoid';
import { writeClient } from './dataService/clients.js';
import { AccountDeleteDataService } from './dataService/accountDeleteDataService.js';
import { setTimeout } from 'timers/promises';
import { SeverityLevel } from '@sentry/types';
import { unleash } from './unleash.js';
import { Unleash } from 'unleash-client';
import { serverLogger } from '@pocket-tools/ts-logger';

export class BatchDeleteHandler {
  readonly sqsClient: SQSClient;
  static readonly eventName = 'pollBatchDelete';
  private unleashClient: Unleash;

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
    this.sqsClient = new SQSClient({
      region: config.aws.region,
      endpoint: config.aws.endpoint,
      maxAttempts: 3,
    });
    this.unleashClient = unleashClient ?? unleash();
    emitter.on(
      BatchDeleteHandler.eventName,
      async () => await this.pollQueue(),
    );
    // Start the polling by emitting an initial event
    if (pollOnInit) {
      emitter.emit(BatchDeleteHandler.eventName);
    }
  }

  /**
   * Delete a message that has been handled from the
   * BatchDelete queue
   * @param message SQS Message recieved from BatchDelete queue
   */
  async deleteMessage(message: Message) {
    const deleteParams = {
      QueueUrl: config.aws.sqs.accountDeleteQueue.url,
      ReceiptHandle: message.ReceiptHandle,
    };
    try {
      await this.sqsClient.send(new DeleteMessageCommand(deleteParams));
    } catch (error) {
      const errorMessage = 'deleteMessage: Error deleting message from queue';
      serverLogger.error({
        message: errorMessage,
        error: error,
        data: message,
      });
      Sentry.addBreadcrumb({ message: errorMessage, data: message });
      Sentry.captureException(error);
    }
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
        data: {
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

  /***
   * handles table specific delete logic
   * @param body
   * @param traceId
   */
  async handleSpecialDeletes(body: SqsMessage, traceId: string) {
    const limitOverridesConfig = config.queueDelete.limitOverrides;

    try {
      if (body.tableName == 'readitla_ril-tmp.campaign_target') {
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

  /**
   * Set a timeout to emit another poll event which will be handled
   * by the listener.
   * @param timeout time to wait, in ms, before sending event
   */
  async scheduleNextPoll(timeout: number) {
    if (timeout > 0) {
      serverLogger.info(`Set next poll timeout at ${timeout}`);
      await setTimeout(timeout);
    }
    this.emitter.emit(BatchDeleteHandler.eventName);
  }

  /**
   * Event-driven polling of SQS queue (listener on event emitter).
   * If a message is received from the queue, process it and schedule
   * the next poll event. Does not throw -- any errors that occur
   * are logged to Sentry and Cloudwatch.
   * Ensures messages are processed in a synchronous, blocking way,
   * to minimize database load.
   */
  async pollQueue() {
    const params = {
      // https://github.com/aws/aws-sdk/issues/233
      AttributeNames: ['SentTimestamp'] as any, // see issue above - bug in the SDK
      MaxNumberOfMessages: config.aws.sqs.accountDeleteQueue.maxMessages,
      MessageAttributeNames: ['All'],
      QueueUrl: config.aws.sqs.accountDeleteQueue.url,
      VisibilityTimeout: config.aws.sqs.accountDeleteQueue.visibilityTimeout,
      WaitTimeSeconds: config.aws.sqs.accountDeleteQueue.waitTimeSeconds,
    };

    serverLogger.info(
      `Begining polling of ${config.aws.sqs.accountDeleteQueue.url}`,
    );

    let data: ReceiveMessageCommandOutput;
    let body: SqsMessage;

    // Short-circuit if killswitch is on
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

    // If short-circuit isn't triggered, check for messages and process them
    try {
      data = await this.sqsClient.send(new ReceiveMessageCommand(params));
      if (data.Messages && data.Messages.length > 0) {
        body = JSON.parse(data.Messages[0].Body);
      }
    } catch (error) {
      const receiveError = 'PollQueue: Error receiving messages from queue';
      serverLogger.error({ message: receiveError, error: error });
      Sentry.addBreadcrumb({ message: receiveError });
      Sentry.captureException(error, { level: 'fatal' as SeverityLevel });
    }
    // Process any messages received and schedule next poll
    if (body != null) {
      const wasSuccess = await this.handleMessage(body);
      if (wasSuccess) {
        await this.deleteMessage(data.Messages[0]);
      }
      // Schedule next message poll
      await this.scheduleNextPoll(
        config.aws.sqs.accountDeleteQueue.afterMessagePollIntervalSeconds *
          1000,
      );
    } else {
      // If no messages were found, schedule another poll after a short time
      await this.scheduleNextPoll(
        config.aws.sqs.accountDeleteQueue.defaultPollIntervalSeconds * 1000,
      );
    }
  }
}
