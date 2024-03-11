/**
 * method to convert graph responses to REST responses
 */

import {
  GetSavedItemsByOffsetCompleteQuery,
  GetSavedItemsByOffsetSimpleQuery,
  SearchSavedItemsByOffsetCompleteQuery,
  SearchSavedItemsByOffsetSimpleQuery,
} from '../../generated/graphql/types';
import {
  ListItemObject,
  ListItemObjectComplete,
  ListItemObjectAdditional,
  GetResponseSimple,
  GetResponseSimpleTotal,
  GetResponseComplete,
  GetResponseCompleteTotal,
  SearchMeta,
  GetSearchResponseSimpleTotal,
  GetSearchResponseComplete,
  GetSearchResponseSimple,
  GetSearchResponseCompleteTotal,
  ListItemWithSearchHighlights,
  ListItemCompleteWithSearchHighlights,
  SearchHighlights,
  FetchResponse,
  PassthroughResponse,
} from '../types';
import * as tx from '../shared/transforms';

type SavedItemSimple =
  GetSavedItemsByOffsetSimpleQuery['user']['savedItemsByOffset']['entries'][number];

type SavedItemComplete =
  GetSavedItemsByOffsetCompleteQuery['user']['savedItemsByOffset']['entries'][number];

/**
 * Extract search highlights from the graph search response.
 * This is the search phrase that was matched, surrounded by
 * <em> tags. The graph will return more than one match if there
 * are multiple, but /v3/get only returns a string for the first
 * matched result.
 */
function HighlightsTransformer(
  highlights: SearchSavedItemsByOffsetSimpleQuery['user']['searchSavedItemsByOffset']['entries'][number]['searchHighlights'],
): SearchHighlights {
  if (highlights == null) {
    return { highlights: null };
  }
  return {
    highlights: {
      fullText: highlights.fullText?.[0] ?? null,
      tags: highlights.tags?.[0] ?? null,
      title: highlights.title?.[0] ?? null,
      url: highlights.url?.[0] ?? null,
    },
  };
}

/**
 * Transform a SavedItemSearchResult into the appropriate
 * REST response, detailType="simple" fields only.
 */
export function SearchResultTransformerSimple(
  searchResult: SearchSavedItemsByOffsetSimpleQuery['user']['searchSavedItemsByOffset']['entries'][number],
  index: number,
): ListItemWithSearchHighlights {
  return {
    ...ListItemTransformerSimple(searchResult.savedItem, index),
    ...HighlightsTransformer(searchResult.searchHighlights),
  };
}
/**
 * Transform a SavedItemSearchResult into the appropriate
 * REST response, for detailType="complete" fields.
 */
export function SearchResultTransformerComplete(
  searchResult: SearchSavedItemsByOffsetCompleteQuery['user']['searchSavedItemsByOffset']['entries'][number],
  index: number,
): ListItemCompleteWithSearchHighlights {
  return {
    ...ListItemTransformerComplete(searchResult.savedItem, index),
    ...HighlightsTransformer(searchResult.searchHighlights),
  };
}

/**
 * Transform a SavedItem entity  (only 'simple'
 * fields requested) to v3 API format.
 */
export function ListItemTransformerSimple(
  savedItem: SavedItemSimple,
  index: number,
): ListItemObject {
  return ListItemTransformer(savedItem, index);
}
/**
 * Transform a SavedItem entity (additional
 * 'complete' fields requested) to v3 API format.
 */
export function ListItemTransformerComplete(
  savedItem: SavedItemComplete,
  index: number,
): ListItemObjectComplete {
  const simple = ListItemTransformer(savedItem, index);
  if (savedItem.item.__typename === 'PendingItem') {
    return simple;
  }
  const completeFieldMap = {
    authors: tx.AuthorsReducer(savedItem.item.authors, savedItem.id),
    domain_metadata: tx.DomainMetadataTransformer(
      savedItem.item.domainMetadata,
    ),
    images: tx.ImagesReducer(savedItem.item.images, savedItem.id),
    tags: tx.TagsReducer(savedItem.tags, savedItem.id),
    videos: tx.VideosReducer(savedItem.item.videos, savedItem.id),
    image: tx.DisplayImageTransformer(savedItem.item.images, savedItem.id),
  };
  const complete = Object.entries(completeFieldMap).reduce(
    (complete, [k, v]) => {
      if (v !== undefined) {
        complete[k] = v;
      }
      return complete;
    },
    {} as ListItemObjectAdditional,
  );
  return { ...simple, ...complete };
}

/**
 * Shared transformer function for 'simple' and 'complete'
 * SavedItem entities. Set default values for unsupported types
 * (e.g. PendingItem) and missing values in GraphQL response.
 */
function ListItemTransformer<T extends SavedItemSimple>(
  savedItem: T,
  index: number,
): ListItemObject | ListItemObjectComplete {
  const baseFields = {
    item_id: savedItem.id,
    favorite: savedItem.isFavorite ? ('1' as const) : ('0' as const),
    status: savedItem.isArchived ? ('1' as const) : ('0' as const),
    time_added: savedItem._createdAt?.toString(),
    time_updated: savedItem._updatedAt?.toString(),
    time_read: (savedItem.archivedAt ?? '0').toString(),
    time_favorited: (savedItem.favoritedAt ?? '0').toString(),
    // TODO POCKET-9657
    listen_duration_estimate: 0,
    sort_id: index,
  };
  const conditionalFields = {};
  switch (savedItem.item.__typename) {
    case 'PendingItem':
      // This case shouldn't happen, but we set values to defaults
      // if there isn't an item
      return {
        ...baseFields,
        resolved_id: '',
        given_url: '',
        given_title: '',
        resolved_title: '',
        resolved_url: '',
        excerpt: '',
        is_article: '0' as const,
        is_index: '0' as const,
        has_video: '0' as const,
        has_image: '0' as const,
        word_count: '0',
        lang: '',
        time_to_read: 0,
      };
    case 'Item':
      savedItem.item.topImage?.url &&
        (conditionalFields['top_image_url'] = savedItem.item.topImage.url);
      return {
        ...baseFields,
        ...conditionalFields,
        // Most of these that default to empty strings should never
        // be undefined in practice, but we will provide defaults to
        // properly conform to expected type
        resolved_id: savedItem.item.resolvedId ?? '',
        given_url: savedItem.item.givenUrl ?? '',
        given_title: savedItem.item.title ?? '',
        resolved_title: savedItem.item.title ?? '',
        resolved_url: savedItem.item.resolvedUrl ?? '',
        excerpt: savedItem.item.excerpt ?? '',
        is_article: savedItem.item.isArticle ? ('1' as const) : ('0' as const),
        is_index: savedItem.item.isIndex ? ('1' as const) : ('0' as const),
        has_video: tx.convertHasVideo(savedItem.item.hasVideo),
        has_image: tx.convertHasImage(savedItem.item.hasImage),
        word_count: (savedItem.item.wordCount ?? 0).toString(),
        lang: savedItem.item.language ?? '',
        time_to_read: savedItem.item.timeToRead ?? 0,
      };
  }
}

/**
 * converts list to map
 * @param input list of entities
 * @param key key to assign the entity
 */
function listToMap<T>(input: T[], key: string): { [key: string]: T } {
  return input.reduce((map, item) => {
    map[item[key]] = item;
    return map;
  }, {});
}

function searchMetaTransformer(
  response:
    | SearchSavedItemsByOffsetSimpleQuery
    | SearchSavedItemsByOffsetCompleteQuery,
): SearchMeta {
  const data = response.user.searchSavedItemsByOffset;
  return {
    search_meta: {
      total_result_count: data.totalCount,
      count: data.limit,
      offset: data.offset,
      has_more: data.totalCount - data.limit > 0,
    },
  };
}

/**
 * converts graphql response to rest response
 * todo: map top level fields as a part of v3/get implementation ticket
 * @param response
 */
export function savedItemsSimpleToRest(
  response: GetSavedItemsByOffsetSimpleQuery,
): GetResponseSimple {
  return {
    // todo: map top level fields
    cachetype: 'db',
    list: listToMap(
      response.user.savedItemsByOffset.entries
        .map((savedItem, index) => ListItemTransformerSimple(savedItem, index))
        .filter((s) => s !== null),
      'item_id',
    ),
  };
}

/**
 * Convert GraphQL response for detailType=complete to v3 API format
 */
export function savedItemsCompleteToRest(
  response: GetSavedItemsByOffsetCompleteQuery,
): GetResponseComplete {
  return {
    cachetype: 'db',
    list: listToMap(
      response.user.savedItemsByOffset.entries
        .map((savedItem, index) =>
          ListItemTransformerComplete(savedItem, index),
        )
        .filter((s) => s !== null),
      'item_id',
    ),
  };
}

/**
 * Convert GraphQL response for /v3/fetch to v3 API format,
 * adding the passthrough field for fetch
 */
export function savedItemsFetchToRest(
  passthrough: PassthroughResponse,
  response: GetSavedItemsByOffsetCompleteQuery,
): FetchResponse {
  return {
    ...savedItemsCompleteTotalToRest(response),
    passthrough,
  };
}

/**
 * Convert GraphQL response for detailType=complete to v3 API format,
 * adding the top-level 'total' field.
 */
export function savedItemsCompleteTotalToRest(
  response: GetSavedItemsByOffsetCompleteQuery,
): GetResponseCompleteTotal {
  return {
    total: response.user.savedItemsByOffset.totalCount.toString(),
    ...savedItemsCompleteToRest(response),
  };
}

/**
 * Convert GraphQL response for detailType=complete to v3 API format,
 * adding the top-level 'total' field.
 */
export function savedItemsSimpleTotalToRest(
  response: GetSavedItemsByOffsetSimpleQuery,
): GetResponseSimpleTotal {
  return {
    total: response.user.savedItemsByOffset.totalCount.toString(),
    ...savedItemsSimpleToRest(response),
  };
}

/**
 * Convert GraphQL response for detailType=simple and search=<some term> to v3 API
 * format.
 */
export function searchSavedItemSimpleToRest(
  response: SearchSavedItemsByOffsetSimpleQuery,
): GetSearchResponseSimple {
  const list =
    response.user.searchSavedItemsByOffset.entries.length === 0
      ? ([] as never[])
      : listToMap(
          response.user.searchSavedItemsByOffset.entries
            .map((searchResult, index) =>
              SearchResultTransformerSimple(searchResult, index),
            )
            .filter((s) => s !== null),
          'item_id',
        );
  return {
    // todo: map top level fields
    cachetype: 'db',
    list,
    ...searchMetaTransformer(response),
  };
}

/**
 * Convert GraphQL response for detailType=complete and search=<some term> to v3 API
 * format.
 */
export function searchSavedItemCompleteToRest(
  response: SearchSavedItemsByOffsetCompleteQuery,
): GetSearchResponseComplete {
  const list =
    response.user.searchSavedItemsByOffset.entries.length === 0
      ? ([] as never[])
      : listToMap(
          response.user.searchSavedItemsByOffset.entries
            .map((searchResult, index) =>
              SearchResultTransformerComplete(searchResult, index),
            )
            .filter((s) => s !== null),
          'item_id',
        );
  return {
    // todo: map top level fields
    cachetype: 'db',
    list,
    ...searchMetaTransformer(response),
  };
}

/**
 * Convert GraphQL response for detailType=complete and search=<some term> to v3 API
 * format, adding top-level total field.
 */
export function searchSavedItemSimpleTotalToRest(
  response: SearchSavedItemsByOffsetSimpleQuery,
): GetSearchResponseSimpleTotal {
  return {
    ...searchSavedItemSimpleToRest(response),
    total: response.user.searchSavedItemsByOffset.totalCount.toString(),
  };
}

/**
 * Convert GraphQL response for detailType=complete and search=<some term> to v3 API
 * format, adding top-level total field.
 */
export function searchSavedItemCompleteTotalToRest(
  response: SearchSavedItemsByOffsetCompleteQuery,
): GetSearchResponseCompleteTotal {
  return {
    ...searchSavedItemCompleteToRest(response),
    total: response.user.searchSavedItemsByOffset.totalCount.toString(),
  };
}
