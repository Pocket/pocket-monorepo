import EventEmitter from 'events';
import config from '../config';
import { BasicItemEventPayloadWithContext, ItemEventPayload } from './types';
import { getUnixTimestamp } from '../utils';
import { ListPocketEventType } from '@pocket-tools/event-bridge';

export class ItemsEventEmitter extends EventEmitter {
  private static buildEvent(
    eventData: BasicItemEventPayloadWithContext,
    eventType: ListPocketEventType,
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
    event: ListPocketEventType,
    data: BasicItemEventPayloadWithContext,
  ): void {
    this.emit(event, ItemsEventEmitter.buildEvent(data, event));
  }
}
