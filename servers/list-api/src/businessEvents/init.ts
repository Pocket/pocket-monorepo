import { ItemsEventEmitter } from './itemsEventEmitter.js';
import { ItemEventHandlerFn } from './eventHandlers.js';

// Init the event emitter
export const itemsEventEmitter = new ItemsEventEmitter();

export function initItemEventHandlers(
  emitter: ItemsEventEmitter,
  handlers: ItemEventHandlerFn[],
) {
  handlers.forEach((handler) => handler(emitter));
}
