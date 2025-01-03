import { BaseEvent } from './base.ts';
import { PocketEventType } from '../events.ts';

export type SearchPocketEventType = PocketEventType.SEARCH_RESPONSE_GENERATED;

export type SearchEvent = SearchResponseGenerated;

export interface SearchResponseGenerated extends BaseEvent {
  // 'source': 'user-event';
  'detail-type': PocketEventType.SEARCH_RESPONSE_GENERATED;
  detail: {
    event: {
      search: SearchResponseEvent;
      user: {
        user_id?: number;
        guid?: number;
        hashed_user_id?: string;
        hashed_guid?: string;
      };
      apiUser: { api_id: number; is_native: boolean; is_trusted: boolean };
    };
  };
}

/***
 * NOTE: The following types are generated from the Pocket Snowplow Schema and are 1:1
 ***/

/**
 * Event triggered when SearchResults are returned from Pocket's search api (for saves and
 * corpus). Entities included: api_user; sometimes user, feature_flag.
 */
interface SearchResponseEvent {
  /**
   * A unique ID for this result
   */
  id: string;
  /**
   * Number of results in the result set.
   */
  result_count_total: number;
  /**
   * Ordered result of urls in the search result connection
   */
  result_urls: string[];
  /**
   * UNIX time in seconds when the results were sent by the Search API.
   */
  returned_at: number;
  /**
   * The search query
   */
  search_query: SearchResponseEventSearchQuery;
  /**
   * Identifies the corpus that was searched
   */
  search_type: string;
}

/**
 * The search query
 */
interface SearchResponseEventSearchQuery {
  /**
   * Identifies the filters which were applied to the search, if applicable.
   */
  filter: Filter[];
  /**
   * 2-5 character language code to indicate the language the search was performed in
   */
  language?: string;
  query: string;
  /**
   * Identifies the fields which were searched.
   */
  scope: Scope;
}

export type Filter =
  | 'domain'
  | 'title'
  | 'tags'
  | 'contentType'
  | 'status'
  | 'isFavorite'
  | 'publishedDateRange'
  | 'topic'
  | 'excludeML'
  | 'excludeCollections'
  | 'addedDateRange'
  | 'publisher'
  | 'author';

/**
 * Identifies the fields which were searched.
 */
export type Scope =
  | 'all'
  | 'all_contentful'
  | 'title'
  | 'excerpt'
  | 'content'
  | 'publisher';
