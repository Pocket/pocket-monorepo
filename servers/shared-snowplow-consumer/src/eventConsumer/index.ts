import { userEventConsumer } from './userEvents/userEventConsumer';
import { prospectEventConsumer } from './prospectEvents/prospectEventConsumer';
import { collectionEventConsumer } from './collectionEvents/collectionEventConsumer';
import { shareableListEventConsumer } from './shareableListEvents/shareableListEventConsumer';
import { shareableListItemEventConsumer } from './shareableListItemEvents/shareableListItemEventConsumer';
import { pocketShareEventConsumer } from './sharesEvents/sharesEventConsumer';
import { pocketSearchEventConsumer } from './searchEvents/searchEventConsumer';
import { PocketEvent, PocketEventType } from '@pocket-tools/event-bridge';

// Mapping of detail-type (via event bridge message)
// to function that should be invoked to process the message
export const eventConsumer: {
  [key: string]: (event: PocketEvent) => void;
} = {
  [PocketEventType.ACCOUNT_DELETION]: userEventConsumer,
  [PocketEventType.ACCOUNT_EMAIL_UPDATED]: userEventConsumer,
  [PocketEventType.PROSPECT_DISMISSED]: prospectEventConsumer,
  [PocketEventType.COLLECTION_CREATED]: collectionEventConsumer,
  [PocketEventType.COLLECTION_UPDATED]: collectionEventConsumer,
  [PocketEventType.SHAREABLE_LIST_CREATED]: shareableListEventConsumer,
  [PocketEventType.SHAREABLE_LIST_UPDATED]: shareableListEventConsumer,
  [PocketEventType.SHAREABLE_LIST_DELETED]: shareableListEventConsumer,
  [PocketEventType.SHAREABLE_LIST_PUBLISHED]: shareableListEventConsumer,
  [PocketEventType.SHAREABLE_LIST_UNPUBLISHED]: shareableListEventConsumer,
  [PocketEventType.SHAREABLE_LIST_HIDDEN]: shareableListEventConsumer,
  [PocketEventType.SHAREABLE_LIST_UNHIDDEN]: shareableListEventConsumer,
  [PocketEventType.SHAREABLE_LIST_ITEM_CREATED]: shareableListItemEventConsumer,
  [PocketEventType.SHAREABLE_LIST_ITEM_UPDATED]: shareableListItemEventConsumer,
  [PocketEventType.SHAREABLE_LIST_ITEM_DELETED]: shareableListItemEventConsumer,
  [PocketEventType.SHARE_CREATED]: pocketShareEventConsumer,
  [PocketEventType.SHARE_CONTEXT_UPDATED]: pocketShareEventConsumer,
  [PocketEventType.SEARCH_RESPONSE_GENERATED]: pocketSearchEventConsumer,
};
