import { ItemsEventEmitter } from './itemsEventEmitter';
import { ItemEventHandlerFn } from './eventHandlers';

// Init the event emitter
export const itemsEventEmitter = new ItemsEventEmitter();

export function initItemEventHandlers(
  emitter: ItemsEventEmitter,
  handlers: ItemEventHandlerFn[],
) {
  handlers.forEach((handler) => handler(emitter));
}
