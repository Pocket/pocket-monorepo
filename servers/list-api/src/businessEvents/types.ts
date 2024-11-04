import { SavedItem, SavedItemStatus } from '../types';
import { ListItem } from '../snowplow/schema';
import {
  BasicListItemEventPayloadContext,
  ListPocketEventTypeEnum,
} from '@pocket-tools/event-bridge';

// Data fields required for all events
export type BasicItemEventPayload = {
  savedItem: SavedItem;
  tags?: string[];
  tagsUpdated?: string[]; //unified event requires tags that are modified in mutation
};

export type BasicItemEventPayloadWithContext = BasicItemEventPayload &
  BasicListItemEventPayloadContext;

// Data common to all events
export type BasicEventData = {
  timestamp: number; // epoch time (ms)
  source: string;
  version: string; // semver (e.g. 1.2.33)
};

export type ItemEventPayload = BasicItemEventPayload &
  BasicListItemEventPayloadContext &
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

export type EventTypeString = keyof typeof ListPocketEventTypeEnum;
export type RequiredEvents = Extract<
  EventTypeString,
  | 'ADD_ITEM'
  | 'DELETE_ITEM'
  | 'ARCHIVE_ITEM'
  | 'UNARCHIVE_ITEM'
  | 'FAVORITE_ITEM'
  | 'UNFAVORITE_ITEM'
  | 'ADD_TAGS'
  | 'REPLACE_TAGS'
  | 'REMOVE_TAGS'
  | 'CLEAR_TAGS'
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
