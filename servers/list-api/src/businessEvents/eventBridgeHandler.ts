import { ItemsEventEmitter } from './itemsEventEmitter';
import { ItemEventPayload } from './types';
import config from '../config';
import { eventBridgeClient } from '../aws/eventBridgeClient';
import {
  PocketEvent,
  ListPocketEventType,
  PocketEventType,
} from '@pocket-tools/event-bridge';

export class EventBridgeHandler {
  constructor(emitter: ItemsEventEmitter, events: Array<ListPocketEventType>) {
    // register handler for item events
    events.forEach((event) =>
      emitter.on(
        PocketEventType[event],
        async (data: ItemEventPayload) => await this.process(data),
      ),
    );
  }
  /**
   * Send event to Event Bus, pulling the event bus and the event source
   * from the config.
   * Will not throw errors if event fails; instead, log exception to Sentry
   * and add to Cloudwatch logs.
   * @param eventPayload the payload to send to event bus
   */
  public async process(data: ItemEventPayload) {
    const pocketEvent: PocketEvent = {
      'detail-type': PocketEventType[data.eventType],
      source: config.serviceName,
      detail: data,
    };

    eventBridgeClient.sendPocketEvent(pocketEvent);
  }
}
