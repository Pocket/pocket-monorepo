import { Visibility, ModerationStatus } from '@prisma/client';
import { ShareableListComplete, ShareableListItem } from '../database/types';

export type ShareableListEventBusPayload = {
  eventType: EventBridgeEventType;
  shareableList: SnowplowShareableList;
};

export type ShareableListItemEventBusPayload = {
  eventType: EventBridgeEventType;
  shareableListItem: SnowplowShareableListItem;
};

export enum EventBridgeEventType {
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
}

export interface EventBridgeEventOptions {
  shareableList?: ShareableListComplete;
  shareableListItem?: ShareableListItem;
  shareableListItemExternalId?: string;
  listExternalId?: string;
  isShareableListEventType?: boolean;
  isShareableListItemEventType?: boolean;
}

/**
 * This ShareableList type maps to the shareable_list entity defined in Snowplow
 */
export type SnowplowShareableList = {
  shareable_list_external_id: string;
  user_id: bigint | number;
  slug?: string;
  title: string;
  description?: string;
  status: Visibility;
  list_item_note_visibility: Visibility;
  moderation_status: ModerationStatus;
  moderated_by?: string;
  moderation_reason?: string;
  moderation_details?: string;
  restoration_reason?: string;
  created_at: number; // snowplow schema requires this field in seconds
  updated_at?: number; // snowplow schema requires this field in seconds
};

/**
 * This ShareableListItem type maps to the shareable_list_item entity defined in Snowplow
 */
export type SnowplowShareableListItem = {
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
  created_at: number; // snowplow schema requires this field in seconds
  updated_at?: number; // snowplow schema requires this field in seconds
};
