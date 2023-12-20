import { UserEventEmitter } from './userEventEmitter';
import { EventBusHandler } from './eventBus/eventBusHandler';

export const userEventEmitter = new UserEventEmitter();

/**
 * Register the EventBus handler
 */
userEventEmitter.initializeHandler(new EventBusHandler());
