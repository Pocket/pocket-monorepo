import { UnifiedEventKinesisHandler } from './unifiedEventKinesisHandler.js';
import { SqsListener } from './sqs/sqsListener.js';
import { ItemsEventEmitter } from './itemsEventEmitter.js';
import { SnowplowHandler } from './snowplowHandler.js';
import { tracker } from '../snowplow/tracker.js';
import config from '../config/index.js';
import { transformers } from './sqs/transformers/index.js';
import { EventType } from './types.js';
import { EventBridgeHandler } from './eventBridgeHandler.js';

export type ItemEventHandlerFn = (emitter: ItemsEventEmitter) => void;

/**
 * @param emitter
 */
export function unifiedEventHandler(emitter: ItemsEventEmitter): void {
  // Create a list of event names (as strings) to register
  // batch kinesis listener for unified event stream
  const unifiedEventsToListen = Object.keys(
    config.aws.kinesis.unifiedEvents.events,
  ) as Array<keyof typeof EventType>;
  new UnifiedEventKinesisHandler(emitter, unifiedEventsToListen);
}

/**
 * @param emitter
 */
export function sqsEventHandler(emitter: ItemsEventEmitter): void {
  // Init SQS events handler
  new SqsListener(emitter, transformers);
}

/**
 * @param emitter
 */
export function snowplowEventHandler(emitter: ItemsEventEmitter): void {
  const snowplowEventsToListen = Object.values(
    config.snowplow.events,
  ) as string[];
  new SnowplowHandler(emitter, tracker, snowplowEventsToListen);
}

export function eventBridgeEventHandler(emitter: ItemsEventEmitter): void {
  const eventsToListen = Object.keys(EventType);
  new EventBridgeHandler(
    emitter,
    eventsToListen as Array<keyof typeof EventType>,
  );
}
