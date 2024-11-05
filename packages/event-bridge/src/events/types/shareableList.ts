import { PocketEventType } from '../events';
import { BaseEvent } from './base';

export type ShareableListEvent =
  | ShareableListCreated
  | ShareableListUpdated
  | ShareableListDeleted
  | ShareableListHidden
  | ShareableListUnhidden
  | ShareableListPublished
  | ShareableListUnpublished;
export type ShareableListItemEvent =
  | ShareableListItemCreated
  | ShareableListItemUpdated
  | ShareableListItemDeleted;

export type ShareableListPocketEventType =
  | PocketEventType.SHAREABLE_LIST_CREATED
  | PocketEventType.SHAREABLE_LIST_UPDATED
  | PocketEventType.SHAREABLE_LIST_DELETED
  | PocketEventType.SHAREABLE_LIST_HIDDEN
  | PocketEventType.SHAREABLE_LIST_UNHIDDEN
  | PocketEventType.SHAREABLE_LIST_PUBLISHED
  | PocketEventType.SHAREABLE_LIST_UNPUBLISHED;

export type ShareableListItemPocketEventType =
  | PocketEventType.SHAREABLE_LIST_ITEM_CREATED
  | PocketEventType.SHAREABLE_LIST_ITEM_UPDATED
  | PocketEventType.SHAREABLE_LIST_ITEM_DELETED;

export enum ShareableListVisibility {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
}

export enum ShareableListModerationVisibility {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
}

export interface ShareableListItem {
  shareable_list_item_external_id: string;
  shareable_list_external_id: string;
  given_url: string;
  title?: string;
  excerpt?: string;
  image_url?: string;
  authors?: string[];
  publisher?: string;
  note?: string;
  sort_order: number;
  /**
   * The timestamp in seconds when the item was created
   */
  created_at: number;
  /**
   * The timestamp in seconds when the item was last updated
   */
  updated_at?: number;
}

export interface ShareableList {
  shareable_list_external_id: string;
  user_id: bigint | number;
  slug?: string;
  title: string;
  description?: string;
  status: ShareableListVisibility;
  list_item_note_visibility: ShareableListVisibility;
  moderation_status: ShareableListModerationVisibility;
  moderated_by?: string;
  moderation_reason?: string;
  moderation_details?: string;
  restoration_reason?: string;
  /**
   * The timestamp in seconds when the item was created
   */
  created_at: number;
  /**
   * The timestamp in seconds when the item was last updated
   */
  updated_at?: number;
}

interface BaseShareableList extends BaseEvent {
  detail: {
    shareableList: ShareableList;
    eventType: ShareableListPocketEventType;
  };
  'detail-type': ShareableListPocketEventType;
}

interface BaseShareableListItem extends BaseEvent {
  detail: {
    shareableListItem: ShareableListItem;
    eventType: ShareableListItemPocketEventType;
  };
  'detail-type': ShareableListItemPocketEventType;
}

export interface ShareableListCreated extends BaseShareableList {
  'detail-type': PocketEventType.SHAREABLE_LIST_CREATED;
}

export interface ShareableListUpdated extends BaseShareableList {
  'detail-type': PocketEventType.SHAREABLE_LIST_UPDATED;
}

export interface ShareableListDeleted extends BaseShareableList {
  'detail-type': PocketEventType.SHAREABLE_LIST_DELETED;
}

export interface ShareableListHidden extends BaseShareableList {
  'detail-type': PocketEventType.SHAREABLE_LIST_HIDDEN;
}

export interface ShareableListUnhidden extends BaseShareableList {
  'detail-type': PocketEventType.SHAREABLE_LIST_UNHIDDEN;
}

export interface ShareableListPublished extends BaseShareableList {
  'detail-type': PocketEventType.SHAREABLE_LIST_PUBLISHED;
}

export interface ShareableListUnpublished extends BaseShareableList {
  'detail-type': PocketEventType.SHAREABLE_LIST_UNPUBLISHED;
}

export interface ShareableListItemCreated extends BaseShareableListItem {
  'detail-type': PocketEventType.SHAREABLE_LIST_ITEM_CREATED;
}

export interface ShareableListItemUpdated extends BaseShareableListItem {
  'detail-type': PocketEventType.SHAREABLE_LIST_ITEM_UPDATED;
}

export interface ShareableListItemDeleted extends BaseShareableListItem {
  'detail-type': PocketEventType.SHAREABLE_LIST_ITEM_DELETED;
}
