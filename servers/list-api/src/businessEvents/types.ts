import { SavedItem, SavedItemStatus } from '../types';
import { ListItem } from '../snowplow/schema';

export enum EventType {
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
}

// Data fields required for all events
export type BasicItemEventPayload = {
  savedItem: SavedItem;
  tags?: string[];
  tagsUpdated?: string[]; //unified event requires tags that are modified in mutation
};

export type BasicItemEventPayloadContext = {
  user: {
    id: string;
    hashedId: string;
    email?: string;
    guid?: number;
    hashedGuid?: string;
    isPremium: boolean;
  };
  apiUser: {
    apiId: string;
    name?: string;
    isNative?: boolean;
    isTrusted?: boolean;
    clientVersion?: string;
  };
  request?: {
    language?: string;
    snowplowDomainUserId?: string;
    snowplowDomainSessionId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
};

export type BasicItemEventPayloadWithContext = BasicItemEventPayload &
  BasicItemEventPayloadContext;

// Data common to all events
export type BasicEventData = {
  timestamp: number; // epoch time (ms)
  source: string;
  version: string; // semver (e.g. 1.2.33)
};

export type ItemEventPayload = BasicItemEventPayload &
  BasicItemEventPayloadContext &
  BasicEventData & { eventType: EventTypeString };

export enum SQSEvents {
  ADD_ITEM = 1,
  ARCHIVE_ITEM = 3,
  FAVORITE_ITEM = 4,
  DELETE_ITEM = 6,
}

export type UnifiedEventType =
  | 'user-list-item-created'
  | 'user-item-archived'
  | 'user-item-deleted'
  | 'item-resolved'
  | 'user-item-tags-added'
  | 'user-item-tags-removed'
  | 'user-item-tags-replaced'
  | 'user-item-favorited'
  | 'user-item-unfavorited'
  | 'user-item-unarchived';

export type EventTypeString = keyof typeof EventType;
export type RequiredEvents = Exclude<
  EventTypeString,
  'DELETE_TAG' | 'RENAME_TAG' | 'UPDATE_TITLE'
>;
export const UnifiedEventMap: Record<RequiredEvents, UnifiedEventType> = {
  ADD_ITEM: 'user-list-item-created',
  DELETE_ITEM: 'user-item-deleted',
  ARCHIVE_ITEM: 'user-item-archived',
  UNARCHIVE_ITEM: 'user-item-unarchived',
  FAVORITE_ITEM: 'user-item-favorited',
  UNFAVORITE_ITEM: 'user-item-unfavorited',
  ADD_TAGS: 'user-item-tags-added',
  REPLACE_TAGS: 'user-item-tags-replaced',
  REMOVE_TAGS: 'user-item-tags-removed',
  CLEAR_TAGS: 'user-item-tags-removed',
};

// Generic key-value object for json event data
type GenericJsonData = {
  [key: string]: any;
};

export type UnifiedEventPayload = BasicEventData & {
  type: UnifiedEventType;
  data: GenericJsonData;
};

export type SnowplowEventType =
  | 'save'
  | 'delete'
  | 'archive'
  | 'unarchive'
  | 'favorite'
  | 'unfavorite'
  | 'tags_update'
  | 'title_update';

export const SnowplowEventMap: Record<
  RequiredEvents & 'UPDATE_TITLE',
  SnowplowEventType
> = {
  ADD_ITEM: 'save',
  DELETE_ITEM: 'delete',
  ARCHIVE_ITEM: 'archive',
  UNARCHIVE_ITEM: 'unarchive',
  FAVORITE_ITEM: 'favorite',
  UNFAVORITE_ITEM: 'unfavorite',
  ADD_TAGS: 'tags_update',
  REPLACE_TAGS: 'tags_update',
  REMOVE_TAGS: 'tags_update',
  CLEAR_TAGS: 'tags_update',
  UPDATE_TITLE: 'title_update',
};

export type SavedItemTypeString = keyof typeof SavedItemStatus;

export const SnowplowSavedItemStatusMap: Record<
  SavedItemTypeString,
  ListItem['status']
> = {
  UNREAD: 'unread',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
  HIDDEN: 'hidden',
};
