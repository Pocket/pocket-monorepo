import { PaginationInput } from '@pocket-tools/apollo-utils';
import {
  SearchItemsSortBy,
  SearchItemsSortOrder,
} from '../__generated__/types';

export type Pagination = PaginationInput;
export type ValidPagination = Omit<PaginationInput, 'last' | 'before'>;

export const DefaultSortDirection = new Map<
  SearchItemsSortBy,
  SearchItemsSortOrder
>([
  [SearchItemsSortBy.CreatedAt, SearchItemsSortOrder.Desc],
  [SearchItemsSortBy.TimeToRead, SearchItemsSortOrder.Asc],
  [SearchItemsSortBy.Relevance, SearchItemsSortOrder.Desc],
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
