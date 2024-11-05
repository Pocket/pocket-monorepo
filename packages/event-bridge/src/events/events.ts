/**
 * The Pocket event types that are supported by the event bridge
 *
 * NOTE: If you add an event type here, you must also add it to the PocketEventTypeMap in index.ts and in the PocketEvent Union type
 */
export enum PocketEventType {
  ACCOUNT_DELETION = 'account-deletion', //source: user-event
  ACCOUNT_EMAIL_UPDATED = 'account-email-updated', // source: user-event
  PREMIUM_PURCHASE = 'Premium Purchase', //source: web-repo
  ACCOUNT_REGISTRATION = 'User Registration', //source: web-repo
  FORGOT_PASSWORD = 'Forgot Password Request', //source: web-repo
  EXPORT_READY = 'list-export-ready', // source: account-data-deleter
  EXPORT_REQUESTED = 'list-export-requested', // source: list-api
  // List Events
  ADD_ITEM = 'ADD_ITEM',
  DELETE_ITEM = 'DELETE_ITEM',
  FAVORITE_ITEM = 'FAVORITE_ITEM',
  UNFAVORITE_ITEM = 'UNFAVORITE_ITEM',
  ARCHIVE_ITEM = 'ARCHIVE_ITEM',
  UNARCHIVE_ITEM = 'UNARCHIVE_ITEM',
  ADD_TAGS = 'ADD_TAGS',
  REPLACE_TAGS = 'REPLACE_TAGS',
  CLEAR_TAGS = 'CLEAR_TAGS',
  REMOVE_TAGS = 'REMOVE_TAGS',
  RENAME_TAG = 'RENAME_TAG',
  DELETE_TAG = 'DELETE_TAG',
  UPDATE_TITLE = 'UPDATE_TITLE',

  // Shareable list events
  SHAREABLE_LIST_CREATED = 'shareable_list_created',
  SHAREABLE_LIST_UPDATED = 'shareable_list_updated',
  SHAREABLE_LIST_DELETED = 'shareable_list_deleted',
  SHAREABLE_LIST_HIDDEN = 'shareable_list_hidden',
  SHAREABLE_LIST_UNHIDDEN = 'shareable_list_unhidden',
  SHAREABLE_LIST_PUBLISHED = 'shareable_list_published',
  SHAREABLE_LIST_UNPUBLISHED = 'shareable_list_unpublished',
  SHAREABLE_LIST_ITEM_CREATED = 'shareable_list_item_created',
  SHAREABLE_LIST_ITEM_UPDATED = 'shareable_list_item_updated',
  SHAREABLE_LIST_ITEM_DELETED = 'shareable_list_item_deleted',

  // Share Events
  SHARE_CREATED = 'pocket_share_created',
  SHARE_CONTEXT_UPDATED = 'pocket_share_context_updated',

  SEARCH_RESPONSE_GENERATED = 'search_response_generated',
}
