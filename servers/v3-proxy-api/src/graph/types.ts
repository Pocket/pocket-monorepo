/**
 * Reusable types intended for use throughout the process go here.
 */

import { GetSavedItemsQuery } from '../generated/graphql/types';

/**
 * type helper, extracts embedded array types
 */
export type Unpack<ArrType extends readonly unknown[]> =
  ArrType extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * Type helper, creates a type with the same keys as another type,
 * but all string type properties. This is the type of express query
 * parameters before they are coerced to appropriate types
 */
export type ToStringParams<T> = {
  [Property in keyof T]: string;
};

// unpack exact GraphQL generated types from GetSavedItemsQuery
export type GraphSavedItemEdge = Unpack<
  GetSavedItemsQuery['user']['savedItems']['edges']
>;

export type GraphSavedItem = GraphSavedItemEdge['node'];
export type GraphItem = Extract<GraphSavedItem['item'], { __typename: 'Item' }>;

export type RestResponse = {
  //todo: add top level fields and sortId
  //e.g status, complete - as they are not mapped by developer portal docs
  list: { [key: string]: ListItemObject };
  cacheType: string;
};

export type ListItemObject = {
  item_id: string;
  resolved_id: string;
  given_url: string;
  resolved_url: string;
  given_title: string;
  resolved_title: string;

  favorite: '0' | '1';
  status: '0' | '1';
  //timestamps are string in v3 response
  time_added: string;
  time_updated: string;
  time_read: string;
  time_favorited: string;
  title: string;
  excerpt: string;
  is_article: '0' | '1';
  is_index: '0' | '1';
  has_video: '0' | '1';
  has_image: '0' | '1';
  word_count: string;
  lang: string;
  time_to_read: number;
  amp_url: string;
  top_image_url: string;
};
