import { PocketEvent, PocketEventType } from '@pocket-tools/event-bridge';
import { accountDeleteHandler } from './handlerFns';

// Mapping of detail-type (via event bridge message)
// to function that should be invoked to process the message
export const handlerMap: {
  [key: string]: (event: PocketEvent) => Promise<void>;
} = {
  [PocketEventType.ACCOUNT_DELETION]: accountDeleteHandler,
};
