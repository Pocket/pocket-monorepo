import { UnifiedEventKinesisHandler } from './unifiedEventKinesisHandler';
import { SqsListener } from './sqs/sqsListener';
import { ItemsEventEmitter } from './itemsEventEmitter';
import { SnowplowHandler } from './snowplowHandler';
import { tracker } from '../snowplow/tracker';
import config from '../config';
import { transformers } from './sqs/transformers';
import { EventType } from './types';
import { EventBridgeHandler } from './eventBridgeHandler';

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
