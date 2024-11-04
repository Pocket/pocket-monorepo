import { PocketEventType } from '../events';

export type ShareableListPocketEventType =
  | PocketEventType.SHAREABLE_LIST_CREATED
  | PocketEventType.SHAREABLE_LIST_UPDATED
  | PocketEventType.SHAREABLE_LIST_DELETED
  | PocketEventType.SHAREABLE_LIST_HIDDEN
  | PocketEventType.SHAREABLE_LIST_UNHIDDEN
  | PocketEventType.SHAREABLE_LIST_PUBLISHED
  | PocketEventType.SHAREABLE_LIST_UNPUBLISHED
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

export type ShareableListItem = {
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
};

export type ShareableList = {
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
};
