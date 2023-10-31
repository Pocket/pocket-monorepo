import EventEmitter from 'events';

export interface EventHandlerInterface {
  init(emitter: EventEmitter): EventHandlerInterface;
}
