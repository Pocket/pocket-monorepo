import EventEmitter from 'events';
import {
  BasicUserEventPayloadWithContext,
  EventType,
  UserEventPayload,
} from './eventType';
import { EventHandlerInterface } from './interfaces';

export class UserEventEmitter extends EventEmitter {
  /**
   * @param eventData
   * @param eventType
   * @private
   */
  private static buildEvent(
    eventData: BasicUserEventPayloadWithContext,
    eventType: EventType,
  ): UserEventPayload {
    return {
      ...eventData,
      eventType: eventType,
    };
  }

  /**
   * @param event
   * @param data
   */
  emitUserEvent(
    event: EventType,
    data: BasicUserEventPayloadWithContext,
  ): void {
    this.emit(event, UserEventEmitter.buildEvent(data, event));
  }

  /**
   * Initialize user event handler
   * @param handlers
   */
  initializeHandler(handler: EventHandlerInterface): void {
    handler.init(this);
  }
}
