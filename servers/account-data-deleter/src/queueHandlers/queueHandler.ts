import { EventEmitter } from 'events';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommandOutput,
} from '@aws-sdk/client-sqs';
import * as Sentry from '@sentry/node';
import { config } from '../config';
import { SqsMessage } from '../routes/queueDelete';
import { setTimeout } from 'timers/promises';
import { SeverityLevel } from '@sentry/types';
import { unleash } from '../unleash';
import { type Unleash } from 'unleash-client';
import { serverLogger } from '@pocket-tools/ts-logger';
import { QueueConfig } from '../types';

export abstract class QueueHandler {
  readonly sqsClient: SQSClient;
  protected unleashClient: Unleash;

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
    public readonly eventName: string,
    public readonly queueConfig: QueueConfig,
    pollOnInit = true,
    unleashClient?: Unleash,
  ) {
    this.sqsClient = new SQSClient({
      region: config.aws.region,
      endpoint: config.aws.endpoint,
      maxAttempts: 3,
    });
    this.unleashClient = unleashClient ?? unleash();
    emitter.on(this.eventName, async () => await this.pollQueue());
    // Start the polling by emitting an initial event
    if (pollOnInit) {
      emitter.emit(this.eventName);
    }
  }

  /**
   * Delete a message that has been handled from the
   * configured queue
   * @param message SQS Message recieved from BatchDelete queue
   */
  async deleteMessage(message: Message) {
    const deleteParams = {
      QueueUrl: this.queueConfig.url,
      ReceiptHandle: message.ReceiptHandle,
    };
    try {
      await this.sqsClient.send(new DeleteMessageCommand(deleteParams));
    } catch (error) {
      const errorMessage = 'Error deleting message from queue';
      serverLogger.error({
        message: errorMessage,
        error: error,
        errorData: message,
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
  abstract handleMessage(body: object): Promise<boolean>;
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
    this.emitter.emit(this.eventName);
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
      MaxNumberOfMessages: this.queueConfig.maxMessages,
      MessageAttributeNames: ['All'],
      QueueUrl: this.queueConfig.url,
      VisibilityTimeout: this.queueConfig.visibilityTimeout,
      WaitTimeSeconds: this.queueConfig.waitTimeSeconds,
    };

    serverLogger.info(`Begining polling of ${this.queueConfig.url}`);

    let data: ReceiveMessageCommandOutput | null = null;
    let body: SqsMessage | null = null;

    try {
      data = await this.sqsClient.send(new ReceiveMessageCommand(params));
      serverLogger.info({ message: 'Poll data received', result: data });
      body =
        data.Messages &&
        data.Messages.length > 0 &&
        data.Messages[0].Body != null
          ? JSON.parse(data.Messages[0].Body)
          : null;
      serverLogger.info({ message: 'Poll body received', body });
    } catch (error) {
      const receiveError = 'PollQueue: Error receiving messages from queue';
      serverLogger.error({ message: receiveError, error: error });
      Sentry.addBreadcrumb({ message: receiveError });
      Sentry.captureException(error, { level: 'fatal' as SeverityLevel });
    }
    // Process any messages received and schedule next poll
    if (body != null) {
      const wasSuccess = await this.handleMessage(body);
      if (wasSuccess && data?.Messages != null) {
        await this.deleteMessage(data.Messages[0]);
      }
      // Schedule next message poll
      await this.scheduleNextPoll(
        this.queueConfig.afterMessagePollIntervalSeconds * 1000,
      );
    } else {
      // If no messages were found, schedule another poll after a short time
      await this.scheduleNextPoll(
        this.queueConfig.defaultPollIntervalSeconds * 1000,
      );
    }
  }
}
