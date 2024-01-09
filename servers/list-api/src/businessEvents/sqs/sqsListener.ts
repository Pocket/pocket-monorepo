import * as Sentry from '@sentry/node';
import { SendMessageCommand, SQS } from '@aws-sdk/client-sqs';
import { ItemsEventEmitter } from '../itemsEventEmitter';
import { EventTransFormer } from './transformers';
import { sqs } from '../../aws/sqs';
import { serverLogger } from '../../server/logger';

/**
 * SQSListener receives business events and adds them to the queue
 */
export class SqsListener {
  private readonly sqs: SQS;

  constructor(
    eventEmitter: ItemsEventEmitter,
    eventTransformers: EventTransFormer[],
  ) {
    this.sqs = sqs;
    for (const transformer of eventTransformers) {
      for (const eventType of transformer.events) {
        eventEmitter.on(eventType, async (data) => {
          const eventData = await transformer.transformer(data);
          return this.process(transformer.queueUrl, eventData);
        });
      }
    }
  }

  public async process(queueUrl: string, data: any) {
    if (!data) return;

    const sendCommand = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(data),
    });
    try {
      await this.sqs.send(sendCommand);
    } catch (err) {
      const errorMessage = `unable to add event to queue: ${queueUrl}`;
      serverLogger.error('unable to add event to queue', {
        data: JSON.stringify(data),
        queueUrl,
      });
      Sentry.captureMessage(errorMessage);
    }
  }
}
