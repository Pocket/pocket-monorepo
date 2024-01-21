import { EventEmitter } from 'events';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommandOutput,
  ReceiveMessageCommandInput,
  QueueAttributeName,
} from '@aws-sdk/client-sqs';
import * as Sentry from '@sentry/node';
import config from '../../config';
import { nanoid } from 'nanoid';
import { readClient, writeClient } from '../../database/client';
import { HighlightsDataService } from '../../dataservices/highlights';
import { setTimeout } from 'timers/promises';
import { failCallback } from '../routes/helper';
import { serverLogger } from '@pocket-tools/ts-logger';
import { SeverityLevel } from '@sentry/types';
import { sqs } from './sqs';

export type BatchDeleteMessage = {
  traceId: string;
  userId: number;
  annotationIds: string[];
};

export class BatchDeleteHandler {
  readonly sqsClient: SQSClient;
  static readonly eventName = 'pollBatchDelete';

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
   */
  constructor(
    public readonly emitter: EventEmitter,
    pollOnInit = true,
  ) {
    this.sqsClient = sqs;
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
      QueueUrl: config.aws.sqs.annotationsDeleteQueue.url,
      ReceiptHandle: message.ReceiptHandle,
    };
    try {
      await this.sqsClient.send(new DeleteMessageCommand(deleteParams));
    } catch (error) {
      const errorMessage = 'Error deleting message from queue ';
      serverLogger.error(errorMessage, error);
      serverLogger.error(JSON.stringify(message));
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
  async handleMessage(body: BatchDeleteMessage): Promise<boolean> {
    serverLogger.info(`handling message` + JSON.stringify(body));
    const traceId = body.traceId ?? nanoid();
    const userId = body.userId.toString();
    try {
      await new HighlightsDataService({
        userId: userId.toString(),
        db: {
          writeClient: writeClient(),
          readClient: readClient(),
        },
        apiId: 'service', // unused but required for inheritance
        isPremium: false, //setting default `false` - but it shouldn't matter for delete
      }).deleteByAnnotationIds(body.annotationIds, traceId);
    } catch (error) {
      failCallback('batchDelete', error, 'Annotations', userId, traceId);
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
    serverLogger.info('emitter on');
    const params: ReceiveMessageCommandInput = {
      AttributeNames: [QueueAttributeName.CreatedTimestamp],
      MaxNumberOfMessages: config.aws.sqs.annotationsDeleteQueue.maxMessages,
      MessageAttributeNames: ['All'],
      QueueUrl: config.aws.sqs.annotationsDeleteQueue.url,
      VisibilityTimeout:
        config.aws.sqs.annotationsDeleteQueue.visibilityTimeout,
      WaitTimeSeconds: config.aws.sqs.annotationsDeleteQueue.waitTimeSeconds,
    };

    let data: ReceiveMessageCommandOutput;
    let body: BatchDeleteMessage;

    serverLogger.info('fetching messages from the sqs queue');
    try {
      data = await this.sqsClient.send(new ReceiveMessageCommand(params));
      if (data.Messages && data.Messages.length > 0) {
        body = JSON.parse(data.Messages[0].Body);
        serverLogger.info('fetched message ->' + JSON.stringify(body));
      }
    } catch (error) {
      const receiveError = 'Error receiving messages from queue';
      serverLogger.error(receiveError, error);
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
        config.aws.sqs.annotationsDeleteQueue.afterMessagePollIntervalSeconds *
          1000,
      );
    } else {
      // If no messages were found, schedule another poll after a short time
      await this.scheduleNextPoll(
        config.aws.sqs.annotationsDeleteQueue.defaultPollIntervalSeconds * 1000,
      );
    }
  }
}
