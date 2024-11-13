import { PaginationInput } from '@pocket-tools/apollo-utils';
import { ItemResponse } from '../externalCaller/parserCaller';

export type User = {
  id: string;
};

export type PageInfo = {
  endCursor?: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
};
export type SavedItemResult = Omit<SavedItem, 'item' | 'tags'>;

export type OffsetPaginationInput = { limit: number; offset: number };

export type SavedItemsPage = {
  entries: SavedItemResult[];
  totalCount: number;
  limit: number;
  offset: number;
};

export type SavedItemConnection = {
  edges: SavedItemEdge[];
  pageInfo: PageInfo;
  totalCount: number;
};

export type SavedItemEdge = {
  cursor: string;
  node?: SavedItem;
};

export type RemoteEntity = {
  id?: string;
  _createdAt?: number;
  _updatedAt?: number;
  _version?: number;
  _deletedAt?: number;
};

export type Item = {
  __typename: string;
  givenUrl: string;
  itemId: string;
  resolvedId: string;
};

export enum PendingItemStatus {
  RESOLVED = 'RESOLVED',
  UNRESOLVED = 'UNRESOLVED',
}

export type PendingItem = {
  __typename: string;
  itemId: string;
  url: string;
  status?: PendingItemStatus;
};

export type SavedItem = RemoteEntity & {
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
};

export type TagConnection = {
  edges: TagEdge[];
  nodes: Tag[];
  pageInfo: PageInfo;
  totalCount: number;
};

export type Tag = RemoteEntity & {
  name: string;
  savedItems?: string[];
};

export type TagEdge = {
  cursor: string;
  node: Tag;
};

export type Pagination = PaginationInput;

export enum SavedItemsContentType {
  VIDEO = 'VIDEO',
  ARTICLE = 'ARTICLE',
  IS_IMAGE = 'IS_IMAGE',
  IS_VIDEO = 'IS_VIDEO',
  HAS_VIDEO = 'HAS_VIDEO',
  IS_READABLE = 'IS_READABLE',
  IS_EXTERNAL = 'IS_EXTERNAL',
  HAS_VIDEO_INCLUSIVE = 'HAS_VIDEO_INCLUSIVE',
}

export type SavedItemsFilter = {
  updatedSince?: number;
  updatedBefore?: number;
  isFavorite?: boolean;
  isArchived?: boolean;
  tagIds?: string[];
  tagNames?: string[];
  isHighlighted?: boolean;
  contentType?: SavedItemsContentType;
  status?: Exclude<SavedItemStatus, SavedItemStatus.DELETED>;
  statuses?: Exclude<SavedItemStatus, SavedItemStatus.DELETED>[];
};

export enum SavedItemsSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum SavedItemsSortBy {
  CREATED_AT = 'CREATED_AT',
  UPDATED_AT = 'UPDATED_AT',
  FAVORITED_AT = 'FAVORITED_AT',
  ARCHIVED_AT = 'ARCHIVED_AT',
}

export type SavedItemsSort = {
  sortBy?: SavedItemsSortBy;
  sortOrder?: SavedItemsSortOrder;
};

export type SavedItemUpsertInput = {
  url: string;
  isFavorite?: boolean;
  timestamp?: number;
  title?: string;
};

export type SavedItemImportInput = {
  url: string;
  createdAt: string; // ISO-formatted timestamp
  title: string;
  tags: string[];
  status: 'UNREAD' | 'ARCHIVED';
};

export type SavedItemImportHydrated = {
  item: ItemResponse;
  import: SavedItemImportInput;
};

/**
 * Keeping the arbitrary numbers consistent with this enum
 */
export enum SavedItemStatus {
  UNREAD = 0,
  ARCHIVED = 1,
  DELETED = 2,
  HIDDEN = 3,
}

export type TagSaveAssociation = {
  name: string;
  savedItemId: string;
};

export type TagSaveAssociationHotfix = {
  name: string;
  savedItemId: string;
  id: number;
};

export type DeleteSavedItemTagsInput = {
  savedItemId: string;
  tagIds: string[];
};

export type SavedItemTagAssociation = {
  savedItemId: string;
  tagId: string;
};

export type SaveTagNameConnection = {
  savedItemId: string;
  tagName: string;
};

export type SavedItemTagsInput = {
  savedItemId: string;
  tags: string[];
};

export type SavedItemTagInput = {
  givenUrl: string;
  tagNames: string[];
};

export type TagUpdateInput = {
  name: string;
  id: string;
};

export type SavedItemTagUpdateInput = {
  savedItemId: string;
  tagIds: string[];
};

export type SavedItemTagsMap = {
  [savedItemId: string]: string[];
};

export type DeleteSaveTagResponse = {
  save: SavedItem;
  removed: string[]; // Names
};

/***
 * PocketSave Entities (a rework of SavedItem) starts here.
 ***/

/***
 * Keeping the arbitrary numbers consistent with PocketSaveStatus enum.
 ***/
export enum PocketSaveStatus {
  UNREAD = 0,
  ARCHIVED = 1,
  DELETED = 2,
  HIDDEN = 3,
}

export type PocketSave = {
  __typename: string;
  archived: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  deletedAt: Date | null;
  favorite: boolean;
  favoritedAt: Date | null;
  givenUrl: string;
  id: string;
  resolvedId: string | null;
  status: keyof typeof PocketSaveStatus;
  suggestedTags?: Tag[];
  tags?: Tag[];
  title: string;
  updatedAt: Date;
};

export type MutationErrorTypes = 'NotFound' | 'SyncConflict';

export interface BaseErrorInternal {
  message: string;
  __typename: MutationErrorTypes;
}

export interface BaseError extends BaseErrorInternal {
  path: string;
  message: string;
  __typename: MutationErrorTypes;
}

export interface NotFoundInternal extends BaseErrorInternal {
  message: string;
  __typename: 'NotFound';
}

export interface NotFound extends NotFoundInternal {
  key?: string;
  value?: string;
}

export type SaveWriteMutationPayload = {
  save: PocketSave[];
  errors: BaseError[];
};

export type SaveMutationInput = {
  id: string[];
  timestamp: Date;
};

export type SaveUpdateTagsInputGraphql = {
  saveId: string;
  removeTagIds: string[];
  addTagNames: string[];
};

/**
 * Input in a better format for doing bulk transactions. Group
 * into array of creates and deletes.
 * Since tags currently do not have an ID field in the database,
 * convert tag ids in delete input back to the tag name.
 */
export type SaveUpdateTagsInputDb = {
  deletes: TagSaveAssociation[];
  creates: TagSaveAssociation[];
};

export type SaveByIdResult = NotFound | PocketSave;

export type SavedItemRefInput = { id?: string; url?: string };

export type ImportLimited = {
  message: string;
  refreshInHours: number;
};
