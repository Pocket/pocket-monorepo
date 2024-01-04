import EventEmitter from 'events';
import config from '../config';
import {
  BasicItemEventPayloadWithContext,
  EventType,
  ItemEventPayload,
} from './types';
import { getUnixTimestamp } from '../utils';

export class ItemsEventEmitter extends EventEmitter {
  private static buildEvent(
    eventData: BasicItemEventPayloadWithContext,
    eventType: EventType,
  ): ItemEventPayload {
    return {
      ...eventData,
      eventType: eventType,
      source: config.events.source,
      version: config.events.version,
      timestamp: getUnixTimestamp(),
    };
  }

  emitItemEvent(
    event: EventType,
    data: BasicItemEventPayloadWithContext,
  ): void {
    this.emit(event, ItemsEventEmitter.buildEvent(data, event));
  }
}
