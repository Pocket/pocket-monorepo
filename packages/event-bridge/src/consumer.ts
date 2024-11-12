import { Consumer, ConsumerOptions } from 'sqs-consumer';
import { IncomingPocketEvent } from './events';
import { type Message } from '@aws-sdk/client-sqs';
import { serverLogger } from '@pocket-tools/ts-logger';
import { sqsPollerEventBridgeEvent } from './utils';

export type PocketEventBridgeSQSConsumerOptions = Omit<
  ConsumerOptions,
  'handleMessage' | 'handleMessageBatch'
> & {
  /**
   * An `async` function (or function that returns a `Promise`) to be called whenever
   * a Pocket Event is received.
   * @param event
   */
  handlePocketEvent(event: IncomingPocketEvent): Promise<void>;
};

export class PocketEventBridgeSQSConsumer extends Consumer {
  constructor(options: PocketEventBridgeSQSConsumerOptions) {
    super({
      messageAttributeNames: ['All'],
      ...options,
      visibilityTimeout: 10000,
      handleMessage: async (message) => {
        return await options.handlePocketEvent(
          PocketEventBridgeSQSConsumer.handleMessage(message),
        );
      },
    });
  }

  private static handleMessage(message: Message): IncomingPocketEvent {
    const pocketEvent = sqsPollerEventBridgeEvent(message);
    if (pocketEvent === null) {
      serverLogger.error('Invalid Pocket Event received', {
        message,
      });
      throw new Error('Invalid Pocket Event received');
    }
    return pocketEvent;
  }

  /**
   * @deprecated Do not use this, instead use `new PocketEventBridgeSQSConsumer()`.
   *
   * Forcing method to force developers to use `new PocketEventBridgeSQSConsumer()` instead of the base `Consumer.create()`.
   * @param options
   */
  static create(options: ConsumerOptions): PocketEventBridgeSQSConsumer {
    throw new Error('Use new PocketEventBridgeSQSConsumer() instead');
  }
}
