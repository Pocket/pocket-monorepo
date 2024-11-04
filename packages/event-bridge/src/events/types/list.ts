import { BaseEvent } from './base';
import { PocketEventType } from '../events';

export type ListPocketEventType =
  | PocketEventType.ADD_ITEM
  | PocketEventType.DELETE_ITEM
  | PocketEventType.FAVORITE_ITEM
  | PocketEventType.UNFAVORITE_ITEM
  | PocketEventType.ARCHIVE_ITEM
  | PocketEventType.UNARCHIVE_ITEM
  | PocketEventType.ADD_TAGS
  | PocketEventType.REPLACE_TAGS
  | PocketEventType.CLEAR_TAGS
  | PocketEventType.REMOVE_TAGS
  | PocketEventType.RENAME_TAG
  | PocketEventType.DELETE_TAG
  | PocketEventType.UPDATE_TITLE;

export const ListPocketEventTypeEnum = {
  ADD_ITEM: PocketEventType.ADD_ITEM,
  DELETE_ITEM: PocketEventType.DELETE_ITEM,
  FAVORITE_ITEM: PocketEventType.FAVORITE_ITEM,
  UNFAVORITE_ITEM: PocketEventType.UNFAVORITE_ITEM,
  ARCHIVE_ITEM: PocketEventType.ARCHIVE_ITEM,
  UNARCHIVE_ITEM: PocketEventType.UNARCHIVE_ITEM,
  ADD_TAGS: PocketEventType.ADD_TAGS,
  REPLACE_TAGS: PocketEventType.REPLACE_TAGS,
  CLEAR_TAGS: PocketEventType.CLEAR_TAGS,
  REMOVE_TAGS: PocketEventType.REMOVE_TAGS,
  RENAME_TAG: PocketEventType.RENAME_TAG,
  DELETE_TAG: PocketEventType.DELETE_TAG,
  UPDATE_TITLE: PocketEventType.UPDATE_TITLE,
} as const;

export type BasicListItemEventPayloadContext = {
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

/**
 * Keeping the arbitrary numbers consistent with this enum
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
enum SavedItemStatus {
  UNREAD = 0,
  ARCHIVED = 1,
  DELETED = 2,
  HIDDEN = 3,
}

interface SavedItem {
  id?: string;
  _createdAt?: number;
  _updatedAt?: number;
  _version?: number;
  _deletedAt?: number;
  resolvedId: string;
  url: string;
  title?: string;
  isFavorite: boolean;
  status: keyof typeof SavedItemStatus;
  favoritedAt?: number;
  isArchived: boolean;
  archivedAt?: number;
  item: {
    givenUrl: string;
  };
  tags?: Tag[];
}

interface Tag {
  id?: string;
  _createdAt?: number;
  _updatedAt?: number;
  _version?: number;
  _deletedAt?: number;
  name: string;
  savedItems?: string[];
}

type ListItemEventPayload = BasicListItemEventPayloadContext & {
  savedItem: SavedItem;
  tags?: string[];
  tagsUpdated?: string[]; //unified event requires tags that are modified in mutation
  timestamp: number; // epoch time (ms)
  source: string;
  version: string; // semver (e.g. 1.2.33)
  eventType: ListPocketEventType;
};

export type ExportRequested = BaseEvent & {
  // 'source': 'list-api';
  'detail-type': PocketEventType.EXPORT_REQUESTED;
  detail: {
    userId: string;
    encodedId: string;
    requestId: string;
    part: number;
    cursor: number;
  } & BasicListItemEventPayloadContext;
};

export type AddItem = BaseEvent & {
  // 'source': 'list-api';
  'detail-type': PocketEventType.ADD_ITEM;
  detail: ListItemEventPayload;
};

export type DeleteItem = BaseEvent & {
  // 'source': 'list-api';
  'detail-type': PocketEventType.DELETE_ITEM;
  detail: ListItemEventPayload;
};

export type FavoriteItem = BaseEvent & {
  // 'source': 'list-api';
  'detail-type': PocketEventType.FAVORITE_ITEM;
  detail: ListItemEventPayload;
};

export type UnfavoriteItem = BaseEvent & {
  // 'source': 'list-api';
  'detail-type': PocketEventType.UNFAVORITE_ITEM;
  detail: ListItemEventPayload;
};

export type ArchiveItem = BaseEvent & {
  // 'source': 'list-api';
  'detail-type': PocketEventType.ARCHIVE_ITEM;
  detail: ListItemEventPayload;
};

export type UnarchiveItem = BaseEvent & {
  // 'source': 'list-api';
  'detail-type': PocketEventType.UNARCHIVE_ITEM;
  detail: ListItemEventPayload;
};

export type AddTags = BaseEvent & {
  // 'source': 'list-api';
  'detail-type': PocketEventType.ADD_TAGS;
  detail: ListItemEventPayload;
};

export type ReplaceTags = BaseEvent & {
  // 'source': 'list-api';
  'detail-type': PocketEventType.REPLACE_TAGS;
  detail: ListItemEventPayload;
};

export type ClearTags = BaseEvent & {
  // 'source': 'list-api';
  'detail-type': PocketEventType.CLEAR_TAGS;
  detail: ListItemEventPayload;
};

export type RemoveTags = BaseEvent & {
  // 'source': 'list-api';
  'detail-type': PocketEventType.REMOVE_TAGS;
  detail: ListItemEventPayload;
};

export type RenameTag = BaseEvent & {
  // 'source': 'list-api';
  'detail-type': PocketEventType.RENAME_TAG;
  detail: ListItemEventPayload;
};

export type DeleteTag = BaseEvent & {
  // 'source': 'list-api';
  'detail-type': PocketEventType.DELETE_TAG;
  detail: ListItemEventPayload;
};

export type UpdateTitle = BaseEvent & {
  // 'source': 'list-api';
  'detail-type': PocketEventType.UPDATE_TITLE;
  detail: ListItemEventPayload;
};
