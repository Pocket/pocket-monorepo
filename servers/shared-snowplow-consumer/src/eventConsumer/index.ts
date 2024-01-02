import { userEventConsumer } from './userEvents/userEventConsumer';
import { prospectEventConsumer } from './prospectEvents/prospectEventConsumer';
import { collectionEventConsumer } from './collectionEvents/collectionEventConsumer';
import { shareableListEventConsumer } from './shareableListEvents/shareableListEventConsumer';
import { shareableListItemEventConsumer } from './shareableListItemEvents/shareableListItemEventConsumer';

//any types shared between events can be added here

//add detail-type of the events from the event-bridge payload
export enum EventType {
  ACCOUNT_DELETION = 'account-deletion',
  ACCOUNT_EMAIL_UPDATED = 'account-email-updated',
  PROSPECT_DISMISS = 'prospect-dismiss',
  COLLECTION_CREATED = 'collection-created',
  COLLECTION_UPDATED = 'collection-updated',
  //shareable-lists-api event types
  SHAREABLE_LIST_CREATED = 'shareable_list_created',
  SHAREABLE_LIST_UPDATED = 'shareable_list_updated',
  SHAREABLE_LIST_DELETED = 'shareable_list_deleted',
  SHAREABLE_LIST_PUBLISHED = 'shareable_list_published',
  SHAREABLE_LIST_UNPUBLISHED = 'shareable_list_unpublished',
  SHAREABLE_LIST_HIDDEN = 'shareable_list_hidden',
  SHAREABLE_LIST_UNHIDDEN = 'shareable_list_unhidden',
  SHAREABLE_LIST_ITEM_CREATED = 'shareable_list_item_created',
  SHAREABLE_LIST_ITEM_UPDATED = 'shareable_list_item_updated',
  SHAREABLE_LIST_ITEM_DELETED = 'shareable_list_item_deleted',
}

// Mapping of detail-type (via event bridge message)
// to function that should be invoked to process the message
export const eventConsumer: {
  [key: string]: (message: any) => void;
} = {
  [EventType.ACCOUNT_DELETION]: userEventConsumer,
  [EventType.ACCOUNT_EMAIL_UPDATED]: userEventConsumer,
  [EventType.PROSPECT_DISMISS]: prospectEventConsumer,
  [EventType.COLLECTION_CREATED]: collectionEventConsumer,
  [EventType.COLLECTION_UPDATED]: collectionEventConsumer,
  [EventType.SHAREABLE_LIST_CREATED]: shareableListEventConsumer,
  [EventType.SHAREABLE_LIST_UPDATED]: shareableListEventConsumer,
  [EventType.SHAREABLE_LIST_DELETED]: shareableListEventConsumer,
  [EventType.SHAREABLE_LIST_PUBLISHED]: shareableListEventConsumer,
  [EventType.SHAREABLE_LIST_UNPUBLISHED]: shareableListEventConsumer,
  [EventType.SHAREABLE_LIST_HIDDEN]: shareableListEventConsumer,
  [EventType.SHAREABLE_LIST_UNHIDDEN]: shareableListEventConsumer,
  [EventType.SHAREABLE_LIST_ITEM_CREATED]: shareableListItemEventConsumer,
  [EventType.SHAREABLE_LIST_ITEM_UPDATED]: shareableListItemEventConsumer,
  [EventType.SHAREABLE_LIST_ITEM_DELETED]: shareableListItemEventConsumer,
};
