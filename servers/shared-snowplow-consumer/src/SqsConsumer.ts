import * as Sentry from '@sentry/node';
import { eventConsumer } from './eventConsumer';
import { EventEmitter } from 'events';
import { config } from './config';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommandOutput,
  SendMessageCommand,
  ReceiveMessageCommandInput,
  QueueAttributeName,
} from '@aws-sdk/client-sqs';
import { setTimeout } from 'timers/promises';

/**
 * class to poll the SQS message from the snowplow event queue,
 * and process the message for sending it to snowplow platform.
 * If we are unable to process the message, we will add it to DLQ
 * and alert sentry.
 * We will delete the message after its processed, whether successful or not
 * from the main queue to prevent queue flooding
 */
export class SqsConsumer {
  readonly sqsClient: SQSClient;
  static readonly eventName = 'pollSnowplowSqsQueue';
  constructor(
    public readonly emitter: EventEmitter,
    pollOnInit = true,
  ) {
    console.log(`retrieving queue`);
    this.sqsClient = new SQSClient({
      region: config.aws.region,
      endpoint: config.aws.endpoint,
      maxAttempts: 3,
    });

    emitter.on(SqsConsumer.eventName, async () => await this.pollMessage());

    // Start the polling by emitting an initial event
    if (pollOnInit) {
      console.log(`emitting sqsConsumer event`);
      emitter.emit(SqsConsumer.eventName);
    }
  }

  /**
   * poll messages from snowplow event queue
   * if processing was successful, then delete the message from the queue
   * if processing was not successful, then add the message to DLQ and delete
   * the message from actual queue, to prevent queue flooding
   */
  async pollMessage() {
    const params: ReceiveMessageCommandInput = {
      AttributeNames: [QueueAttributeName.CreatedTimestamp],
      MaxNumberOfMessages: config.aws.sqs.sharedSnowplowQueue.maxMessages,
      MessageAttributeNames: ['All'],
      QueueUrl: config.aws.sqs.sharedSnowplowQueue.url,
      VisibilityTimeout: config.aws.sqs.sharedSnowplowQueue.visibilityTimeout,
      WaitTimeSeconds: config.aws.sqs.sharedSnowplowQueue.waitTimeSeconds,
    };

    let data: ReceiveMessageCommandOutput;
    let eventBridgeContent: any; //body is generic based on event payload

    try {
      data = await this.sqsClient.send(new ReceiveMessageCommand(params));
      if (data.Messages && data.Messages.length > 0) {
        //body contains SNS payload
        const body = JSON.parse(data.Messages[0].Body);
        //get the eventBridge content from SNS.Message
        eventBridgeContent = JSON.parse(body.Message);
        console.log(`SQS body -> ` + JSON.stringify(body));
      }
    } catch (error) {
      const receiveError = `Error receiving messages from queue ${JSON.stringify(
        data?.Messages[0].Body,
      )}`;
      console.error(receiveError, error);
      Sentry.addBreadcrumb({ message: receiveError });
      Sentry.captureException(error, { level: Sentry.Severity.Critical });
    }
    // Process any messages received and schedule next poll
    if (eventBridgeContent != null) {
      const status = await this.processMessage(eventBridgeContent);

      if (!status) {
        console.log(`adding to DLQ -> ${JSON.stringify(data.Messages[0])}`);
        await this.insertToDLQ(data.Messages[0]);
      }

      //delete all messages as they are moved to DLQ
      await this.deleteMessage(data.Messages[0]);

      // Schedule next message poll
      await this.scheduleNextPoll(
        config.aws.sqs.sharedSnowplowQueue.afterMessagePollIntervalSeconds *
          1000,
      );
    } else {
      // If no messages were found, schedule another poll after 5 mins
      await this.scheduleNextPoll(
        config.aws.sqs.sharedSnowplowQueue.defaultPollIntervalSeconds * 1000,
      );
    }
  }

  /**
   * returns false if it cannot process the given message
   * any error is logged in sentry
   * @param event, event bridge content from SNS payload
   * @return true if processed successfully, false if error occurs
   */
  async processMessage(event: any) {
    try {
      const detailType = event['detail-type'];

      if (eventConsumer[detailType] == null) {
        throw new Error(
          `Unable to retrieve handler for detailType='${detailType}'`,
        );
      }

      await eventConsumer[detailType](event);
      return true;
    } catch (error) {
      const errorMessage = 'Error processing message from queue';
      console.error(errorMessage, error);
      console.error(JSON.stringify(event));
      Sentry.addBreadcrumb({ message: errorMessage, data: event });
      Sentry.captureException(error);
      return false;
    }
  }

  /**
   * schedules the next polling
   * @param timeout
   */
  async scheduleNextPoll(timeout: number) {
    if (timeout > 0) {
      await setTimeout(timeout);
    }
    this.emitter.emit(SqsConsumer.eventName);
  }

  /**
   * Delete a message that has been handled from the
   * snowplow event queue
   * @param message processed SQS message
   */
  private async deleteMessage(message: Message) {
    console.log(`deleting SQS message -> ` + JSON.stringify(message));

    const deleteParams = {
      QueueUrl: config.aws.sqs.sharedSnowplowQueue.url,
      ReceiptHandle: message.ReceiptHandle,
    };
    try {
      await this.sqsClient.send(new DeleteMessageCommand(deleteParams));
    } catch (error) {
      const errorMessage = 'Error deleting message from queue';
      console.error(errorMessage, error);
      console.error(JSON.stringify(message));
      Sentry.addBreadcrumb({ message: errorMessage, data: message });
      Sentry.captureException(error);
    }
  }

  private async insertToDLQ(message) {
    const insertParams = {
      QueueUrl: config.aws.sqs.sharedSnowplowQueue.dlqUrl,
      MessageBody: message.Body,
    };
    try {
      await this.sqsClient.send(new SendMessageCommand(insertParams));
    } catch (error) {
      const errorMessage = 'Error inserting message from queue';
      console.error(errorMessage, error);
      console.error(JSON.stringify(message));
      Sentry.addBreadcrumb({ message: errorMessage, data: message });
      Sentry.captureException(error);
    }
  }
}
