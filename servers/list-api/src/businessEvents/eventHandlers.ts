import { UnifiedEventKinesisHandler } from './unifiedEventKinesisHandler';
import { SqsListener } from './sqs/sqsListener';
import { ItemsEventEmitter } from './itemsEventEmitter';
import { SnowplowHandler } from './snowplowHandler';
import { tracker } from '../snowplow/tracker';
import config from '../config';
import { transformers } from './sqs/transformers';
import { EventBridgeHandler } from './eventBridgeHandler';
import {
  ListPocketEventType,
  PocketEventType,
} from '@pocket-tools/event-bridge';

export type ItemEventHandlerFn = (emitter: ItemsEventEmitter) => void;

/**
 * @param emitter
 */
export function unifiedEventHandler(emitter: ItemsEventEmitter): void {
  // Create a list of event names (as strings) to register
  // batch kinesis listener for unified event stream
  const unifiedEventsToListen = Object.keys(
    config.aws.kinesis.unifiedEvents.events,
  ) as Array<ListPocketEventType>;
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
  const eventsToListen = Object.keys(PocketEventType);
  new EventBridgeHandler(emitter, eventsToListen as Array<ListPocketEventType>);
}
