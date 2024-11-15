import { PocketEvent, PocketEventType } from '@pocket-tools/event-bridge';
import { accountDeleteHandler } from './accountDeleteHandler';
import { premiumPurchaseHandler } from './premiumPurchaseHandler';
import { itemUpdateHandler } from './itemUpdateHandler';
import { itemDeleteHandler } from './itemDeleteHandler';

// Mapping of detail-type (via event bridge message)
// to function that should be invoked to process the message
export const handlerMap: {
  [key: string]: (event: PocketEvent[]) => Promise<void>;
} = {
  [PocketEventType.ACCOUNT_DELETION]: accountDeleteHandler,
  [PocketEventType.PREMIUM_PURCHASE]: premiumPurchaseHandler,
  [PocketEventType.ADD_ITEM]: itemUpdateHandler,
  [PocketEventType.ARCHIVE_ITEM]: itemUpdateHandler,
  [PocketEventType.UNARCHIVE_ITEM]: itemUpdateHandler,
  [PocketEventType.DELETE_ITEM]: itemDeleteHandler,
  [PocketEventType.ADD_TAGS]: itemUpdateHandler,
  [PocketEventType.REMOVE_TAGS]: itemUpdateHandler,
  [PocketEventType.REPLACE_TAGS]: itemUpdateHandler,
  [PocketEventType.CLEAR_TAGS]: itemUpdateHandler,
  [PocketEventType.FAVORITE_ITEM]: itemUpdateHandler,
  [PocketEventType.UNFAVORITE_ITEM]: itemUpdateHandler,
};
