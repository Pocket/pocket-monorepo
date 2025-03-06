import { EventEmitter } from 'events';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommandOutput,
} from '@aws-sdk/client-sqs';
import * as Sentry from '@sentry/node';
import { setTimeout } from 'timers/promises';
import { serverLogger } from '@pocket-tools/ts-logger';
import * as otel from '@opentelemetry/api';

export interface QueueConfig {
  batchSize: number;
  url: string;
  visibilityTimeout: number;
  maxMessages: number;
  waitTimeSeconds: number;
  defaultPollIntervalSeconds: number;
  afterMessagePollIntervalSeconds: number;
  messageRetentionSeconds: number;
  name: string;
}

export abstract class QueuePoller<TMessageBody> {
  private tracer: otel.Tracer;

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
    protected events: {
      emitter: EventEmitter;
      eventName: string;
    },
    protected sqs: {
      config: QueueConfig;
      client: SQSClient;
    },
    protected opts: {
      pollOnInit?: boolean;
    },
  ) {
    // Default to polling when class is instantiated (really only when
    // testing do you want it otherwise)
    const pollOnInit = opts.pollOnInit != null ? opts.pollOnInit : true;
    this.tracer = otel.trace.getTracer('queue-tracer');
    events.emitter.on(events.eventName, async () => await this.pollQueue());
    // Start the polling by emitting an initial event
    if (pollOnInit) {
      events.emitter.emit(events.eventName);
    }
  }

  /**
   * Delete a message that has been handled from the
   * configured queue
   * @param message SQS Message recieved from BatchDelete queue
   */
  async deleteMessage(message: Message) {
    const deleteParams = {
      QueueUrl: this.sqs.config.url,
      ReceiptHandle: message.ReceiptHandle,
    };
    try {
      await this.sqs.client.send(new DeleteMessageCommand(deleteParams));
    } catch (error) {
      const errorMessage = 'Error deleting message from queue';
      serverLogger.error({
        message: errorMessage,
        error: error,
        errorData: message,
        queue: this.sqs.config.url,
      });
      Sentry.captureException(error, {
        data: { ...message, queue: this.sqs.config.url },
      });
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
  abstract handleMessage(body: TMessageBody): Promise<boolean>;
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
    this.events.emitter.emit(this.events.eventName);
  }

  /**
   * Wrap poll queue method to have manual Sentry isolation,
   * and open telemetry context, for background jobs.
   * https://docs.sentry.io/platforms/javascript/guides/node/configuration/async-context/
   * @returns
   */
  async pollQueue() {
    return await Sentry.withIsolationScope(async () => {
      return await this.tracer.startActiveSpan(
        `poll-queue-${this.sqs.config.name}`,
        { root: true },
        async (span: otel.Span) => {
          await this.__pollQueue(span);
          span.end();
        },
      );
    });
  }

  /**
   * Event-driven polling of SQS queue (listener on event emitter).
   * If a message is received from the queue, process it and schedule
   * the next poll event. Does not throw -- any errors that occur
   * are logged to Sentry and Cloudwatch.
   * Ensures messages are processed in a synchronous, blocking way,
   * to minimize database load.
   */
  private async __pollQueue(span: otel.Span) {
    const params = {
      // https://github.com/aws/aws-sdk/issues/233
      AttributeNames: ['SentTimestamp'] as any, // see issue above - bug in the SDK
      MaxNumberOfMessages: this.sqs.config.maxMessages,
      MessageAttributeNames: ['All'],
      QueueUrl: this.sqs.config.url,
      VisibilityTimeout: this.sqs.config.visibilityTimeout,
      WaitTimeSeconds: this.sqs.config.waitTimeSeconds,
    };

    serverLogger.info(`Begining polling of ${this.sqs.config.url}`);

    let data: ReceiveMessageCommandOutput | null = null;
    let body: TMessageBody | null = null;

    try {
      data = await this.sqs.client.send(new ReceiveMessageCommand(params));
      body =
        data.Messages &&
        data.Messages.length > 0 &&
        data.Messages[0].Body != null
          ? JSON.parse(data.Messages[0].Body)
          : null;
    } catch (error) {
      const receiveError = 'PollQueue: Error receiving messages from queue';
      serverLogger.error({
        message: receiveError,
        error: error,
        queue: this.sqs.config.url,
      });
      Sentry.captureException(error, {
        data: { queue: this.sqs.config.url },
      });
      span.recordException(error);
      span.setStatus({ code: otel.SpanStatusCode.ERROR });
    }
    // Process any messages received and schedule next poll
    if (body != null) {
      const wasSuccess = await this.handleMessage(body);
      if (wasSuccess && data?.Messages != null) {
        await this.deleteMessage(data.Messages[0]);
      }
      // Schedule next message poll
      await this.scheduleNextPoll(
        this.sqs.config.afterMessagePollIntervalSeconds * 1000,
      );
    } else {
      // If no messages were found, schedule another poll after a short time
      await this.scheduleNextPoll(
        this.sqs.config.defaultPollIntervalSeconds * 1000,
      );
    }
  }
}
