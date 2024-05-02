import { UserEventEmitter } from './userEventEmitter.js';
import { EventBusHandler } from './eventBus/eventBusHandler.js';

export const userEventEmitter = new UserEventEmitter();

/**
 * Register the EventBus handler
 */
userEventEmitter.initializeHandler(new EventBusHandler());
