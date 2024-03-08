import { PaginationInput } from '@pocket-tools/apollo-utils';

export type User = {
  id: string;
};

type SearchSavedItemParametersBase = {
  term: string;
  filter?: SavedItemsFilter;
  sort?: SearchSortInput;
};

export type SearchSavedItemParameters = SearchSavedItemParametersBase & {
  pagination?: Pagination;
};

export type SearchSavedItemOffsetParams = SearchSavedItemParametersBase & {
  pagination?: OffsetPagination;
};

export type OffsetPagination = {
  limit: number;
  offset: number;
};

export type PageInfo = {
  endCursor?: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
};

export type SavedItemSearchResultConnection = {
  edges: SearchSavedItemEdge[];
  pageInfo: PageInfo;
  totalCount: number;
};

export type SavedItemSearchResultPage = {
  entries: SavedItemSearchResult[];
  offset: number;
  limit: number;
  totalCount: number;
};

export type SearchSavedItemEdge = {
  cursor: string;
  node?: SavedItemSearchResult;
};

export type RemoteEntity = {
  id: string;
  _createdAt?: number;
  _updatedAt?: number;
  _version?: number;
  _deletedAt?: number;
};

export type SavedItem = {
  id: string;
};

export type Tag = RemoteEntity & {
  name: string;
  savedItems?: string[];
};

export type Pagination = PaginationInput;
export type ValidPagination = Omit<PaginationInput, 'last' | 'before'>;

export enum SavedItemContentType {
  VIDEO = 'VIDEO',
  ARTICLE = 'ARTICLE',
  IMAGE = 'IMAGE',
}

export type SavedItemSearchResult = {
  savedItem: SavedItem;
  searchHighlights?: SaveItemSearchHighlights;
};

export type SaveItemSearchHighlights = {
  fullText: string[];
  url: string[];
  tags: string[];
  title: string[];
};

export type SavedItemsFilter = {
  domain?: string;
  isFavorite?: boolean;
  contentType?: SavedItemContentType;
  status?: SearchFilterStatus;
};

export enum SearchFilterStatus {
  ARCHIVED = 'ARCHIVED',
  UNREAD = 'UNREAD',
}

export enum SearchItemsSortBy {
  CREATED_AT = 'CREATED_AT',
  TIME_TO_READ = 'TIME_TO_READ',
  RELEVANCE = 'RELEVANCE',
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export const DefaultSortDirection = new Map<SearchItemsSortBy, SortDirection>([
  [SearchItemsSortBy.CREATED_AT, SortDirection.DESC],
  [SearchItemsSortBy.TIME_TO_READ, SortDirection.ASC],
  [SearchItemsSortBy.RELEVANCE, SortDirection.DESC],
]);

export const defaultPage = 30;

/**
 * Keeping the arbitrary numbers consistent with this enum
 */
export enum SavedItemStatus {
  UNREAD = 0,
  ARCHIVED = 1,
  DELETED = 2,
  HIDDEN = 3,
}

/**
 * Advanced search filter inputs
 */
export type AdvancedSearchFilters = Partial<{
  isFavorite: boolean;
  title: string;
  contentType: SavedItemContentType;
  status: SearchFilterStatus;
  domain: string;
  // For now, 'OR' combination only
  tags: string[];
}>;

export type SearchSortInput = {
  sortBy: SearchItemsSortBy;
  sortOrder?: SortDirection;
};

type AdvancedSearchParamsBase = Partial<{
  queryString: string;
  filter: AdvancedSearchFilters;
  sort: SearchSortInput;
}>;

export type AdvancedSearchParams = AdvancedSearchParamsBase & {
  pagination?: Pagination;
};
export type AdvancedSearchByOffsetParams = AdvancedSearchParamsBase & {
  pagination?: OffsetPagination;
};
/**
 * The schema of the saved item in elasticsearch
 */
export type ElasticSearchSavedItem = {
  _id: string;
  _index: string;
  _score: number;
  _type: string;
  authors?: string[];
  content_type: string[];
  date_added: Date;
  date_published: Date;
  domain_id: number;
  excerpt: string;
  favorite: boolean;
  full_text: string;
  item_id: number;
  lang: string;
  resolved_id: number;
  status: string;
  tags: string[];
  url: string;
  user_id: number;
  word_count: number;
};
