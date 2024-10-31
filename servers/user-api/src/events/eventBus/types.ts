import { PocketEvent } from '@pocket-tools/event-bridge';

export type EventHandlerCallbackMap = {
  [key: string]: (data: any) => PocketEvent;
};
