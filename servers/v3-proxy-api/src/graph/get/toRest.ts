/**
 * method to convert graph responses to REST responses
 */

import {
  SavedItemsCompleteQuery,
  SavedItemsSimpleQuery,
  SearchSavedItemsCompleteQuery,
  SearchSavedItemsSimpleQuery,
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
  GetStaticResponse,
  GetSharesResponse,
  GetTopLevelDefaultResponse,
  Annotations,
} from '../types';
import * as tx from '../shared/transforms';

type SavedItemSimple =
  SavedItemsSimpleQuery['user']['savedItemsByOffset']['entries'][number];

type SavedItemComplete =
  SavedItemsCompleteQuery['user']['savedItemsByOffset']['entries'][number];

/**
 * The default and static set of fields that are in all v3/get responses
 * This should be expanded into all responses
 */
const staticV3ResponseDefaults: GetStaticResponse = {
  maxActions: 30,
  cachetype: 'db',
};

/**
 * The default and static set of fields that are in all v3/get responses that request `shares` (or shares=1)
 * This should be expanded into all share request responses
 * (these are not used, but Android doesn't like when its not included)
 */
export const staticV3ShareResponseDefaults: GetSharesResponse = {
  recent_friends: [],
  auto_complete_emails: [],
  unconfirmed_shares: [],
};

function getStatusResponse(
  response: SavedItemsCompleteQuery | SavedItemsSimpleQuery,
): GetTopLevelDefaultResponse {
  if (response.user.savedItemsByOffset === undefined) {
    return {
      status: 0,
      error: 1,
      complete: 1,
      since: 0,
    };
  }

  const latestItem = response.user.savedItemsByOffset.entries.reduce(
    (maxObject, currentObject) => {
      if (
        maxObject === null ||
        currentObject._updatedAt > maxObject._updatedAt
      ) {
        return currentObject;
      } else {
        return maxObject;
      }
    },
    null,
  );

  return {
    status: response.user.savedItemsByOffset.totalCount > 0 ? 1 : 2,
    error: null,
    complete: 1,
    since:
      latestItem === null || latestItem._updatedAt === null
        ? 0
        : latestItem._updatedAt,
  };
}

function searchStatusResponse(
  response: SearchSavedItemsCompleteQuery | SearchSavedItemsSimpleQuery,
): GetTopLevelDefaultResponse {
  if (response.user.searchSavedItemsByOffset === undefined) {
    return {
      status: 0,
      error: 1,
      complete: 1,
      since: 0,
    };
  }

  const latestItem = response.user.searchSavedItemsByOffset.entries.reduce(
    (maxObject, currentObject) => {
      if (
        maxObject === null ||
        currentObject.savedItem._updatedAt > maxObject.savedItem._updatedAt
      ) {
        return currentObject;
      } else {
        return maxObject;
      }
    },
    null,
  );

  return {
    status: response.user.searchSavedItemsByOffset.totalCount > 0 ? 1 : 2,
    error: null,
    complete: 1,
    since:
      latestItem === null ||
      latestItem.savedItem === null ||
      latestItem.savedItem._updatedAt === null
        ? 0
        : latestItem.savedItem._updatedAt,
  };
}

/**
 * Extract search highlights from the graph search response.
 * This is the search phrase that was matched, surrounded by
 * <em> tags. The graph will return more than one match if there
 * are multiple, but /v3/get only returns a string for the first
 * matched result.
 */
function HighlightsTransformer(
  highlights: SearchSavedItemsSimpleQuery['user']['searchSavedItemsByOffset']['entries'][number]['searchHighlights'],
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

/** Extract list of tags from the graph search response */
function TagListTransformer(
  tags: string[] | undefined,
): { tags: string[] } | {} {
  if (tags != null) {
    return { tags };
  }
  return {};
}

/**
 * Extract annotations (highlights) from the graph search response.
 */
function AnnotationsTransformer(
  savedItem: SearchSavedItemsSimpleQuery['user']['searchSavedItemsByOffset']['entries'][number]['savedItem'],
): Annotations | undefined {
  if (
    savedItem.annotations == null ||
    savedItem.annotations.highlights == null ||
    savedItem.annotations.highlights.length === 0
  ) {
    return;
  }
  return {
    annotations: savedItem.annotations.highlights.map((highlight) => ({
      annotation_id: highlight.id,
      item_id: savedItem.id,
      quote: highlight.quote,
      patch: highlight.patch,
      version: highlight.version.toString(),
      // TODO: Ensure Android can consume this -- /v3 returns central time
      // timestamp without timezone (e.g. "2024-03-29 13:54:32")
      created_at: new Date(highlight._createdAt * 1000).toISOString(),
    })),
  };
}

/**
 * Transform a SavedItemSearchResult into the appropriate
 * REST response, detailType="simple" fields only.
 */
export function SearchResultTransformerSimple(
  searchResult: SearchSavedItemsSimpleQuery['user']['searchSavedItemsByOffset']['entries'][number],
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
  searchResult: SearchSavedItemsCompleteQuery['user']['searchSavedItemsByOffset']['entries'][number],
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
    authors: tx.AuthorsReducer(
      savedItem.item.authors,
      savedItem.item.resolvedId,
    ),
    domain_metadata: tx.DomainMetadataTransformer(
      savedItem.item.domainMetadata,
    ),
    images: tx.ImagesReducer(savedItem.item.images, savedItem.item.resolvedId),
    tags: tx.TagsReducer(savedItem.tags, savedItem.item.resolvedId),
    videos: tx.VideosReducer(savedItem.item.videos, savedItem.item.resolvedId),
    image: tx.DisplayImageTransformer(
      savedItem.item.images,
      savedItem.item.resolvedId,
    ),
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
  const statusMap = {
    UNREAD: '0' as const,
    ARCHIVED: '1' as const,
    DELETED: '2' as const,
    HIDDEN: '3' as const,
  };
  const baseFields = {
    item_id: savedItem.id,
    favorite: savedItem.isFavorite ? ('1' as const) : ('0' as const),
    status: statusMap[savedItem.status],
    time_added: savedItem._createdAt?.toString(),
    time_updated: savedItem._updatedAt?.toString(),
    time_read: (savedItem.archivedAt ?? '0').toString(),
    time_favorited: (savedItem.favoritedAt ?? '0').toString(),
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
        given_title: savedItem.title ?? '',
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
        listen_duration_estimate: 0,
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
        given_title: savedItem.title ?? savedItem.item.title ?? '', // fall back to resolved_title if not provided and null
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
        listen_duration_estimate: savedItem.item.listenDuration ?? 0,
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
  response: SearchSavedItemsSimpleQuery | SearchSavedItemsCompleteQuery,
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
  response: SavedItemsSimpleQuery,
  options?: { withAnnotations?: boolean },
): GetResponseSimple {
  return {
    ...staticV3ResponseDefaults,
    ...getStatusResponse(response),
    ...TagListTransformer(response.user.tagsList),
    list: listToMap(
      response.user.savedItemsByOffset.entries
        .map((savedItem, index) => {
          if (options?.withAnnotations) {
            return {
              ...ListItemTransformerSimple(savedItem, index),
              ...AnnotationsTransformer(savedItem),
            };
          } else {
            return ListItemTransformerSimple(savedItem, index);
          }
        })
        .filter((s) => s !== null),
      'item_id',
    ),
  };
}

/**
 * Convert GraphQL response for detailType=complete to v3 API format
 */
export function savedItemsCompleteToRest(
  response: SavedItemsCompleteQuery,
  options?: { withAnnotations?: boolean },
): GetResponseComplete {
  return {
    ...staticV3ResponseDefaults,
    ...getStatusResponse(response),
    ...TagListTransformer(response.user.tagsList),
    list: listToMap(
      response.user.savedItemsByOffset.entries
        .map((savedItem, index) => {
          if (options?.withAnnotations) {
            return {
              ...ListItemTransformerComplete(savedItem, index),
              ...AnnotationsTransformer(savedItem),
            };
          } else {
            return ListItemTransformerComplete(savedItem, index);
          }
        })
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
  response: SavedItemsCompleteQuery,
  options?: { withAnnotations?: boolean },
): FetchResponse {
  return {
    ...savedItemsCompleteTotalToRest(response, options),
    passthrough,
  };
}

/**
 * Convert GraphQL response for /v3/fetch to v3 API format,
 * adding the passthrough field for fetch
 */
export function savedItemsFetchSharesToRest(
  passthrough: PassthroughResponse,
  response: SavedItemsCompleteQuery,
  options?: { withAnnotations?: boolean },
): FetchResponse & GetSharesResponse {
  return {
    ...staticV3ShareResponseDefaults,
    ...savedItemsCompleteTotalToRest(response, options),
    passthrough,
  };
}

/**
 * Convert GraphQL response for detailType=complete to v3 API format,
 * adding the top-level 'total' field.
 */
export function savedItemsCompleteTotalToRest(
  response: SavedItemsCompleteQuery,
  options?: { withAnnotations?: boolean },
): GetResponseCompleteTotal {
  return {
    total: response.user.savedItemsByOffset.totalCount.toString(),
    ...savedItemsCompleteToRest(response, options),
  };
}

/**
 * Convert GraphQL response for detailType=complete to v3 API format,
 * adding the top-level 'total' field.
 */
export function savedItemsSimpleTotalToRest(
  response: SavedItemsSimpleQuery,
  options?: { withAnnotations?: boolean },
): GetResponseSimpleTotal {
  return {
    total: response.user.savedItemsByOffset.totalCount.toString(),
    ...savedItemsSimpleToRest(response, options),
  };
}

/**
 * Convert GraphQL response for detailType=simple and search=<some term> to v3 API
 * format.
 */
export function searchSavedItemSimpleToRest(
  response: SearchSavedItemsSimpleQuery,
  options?: { withAnnotations?: boolean },
): GetSearchResponseSimple {
  const list =
    response.user.searchSavedItemsByOffset.entries.length === 0
      ? ([] as never[])
      : listToMap(
          response.user.searchSavedItemsByOffset.entries
            .map((searchResult, index) => {
              if (options?.withAnnotations) {
                return {
                  ...SearchResultTransformerSimple(searchResult, index),
                  ...(AnnotationsTransformer(searchResult.savedItem) ?? {}),
                };
              } else {
                return SearchResultTransformerSimple(searchResult, index);
              }
            })
            .filter((s) => s !== null),
          'item_id',
        );
  return {
    ...staticV3ResponseDefaults,
    ...searchStatusResponse(response),
    ...TagListTransformer(response.user.tagsList),
    list,
    ...searchMetaTransformer(response),
  };
}

/**
 * Convert GraphQL response for detailType=complete and search=<some term> to v3 API
 * format.
 */
export function searchSavedItemCompleteToRest(
  response: SearchSavedItemsCompleteQuery,
  options?: { withAnnotations?: boolean },
): GetSearchResponseComplete {
  const list =
    response.user.searchSavedItemsByOffset.entries.length === 0
      ? ([] as never[])
      : listToMap(
          response.user.searchSavedItemsByOffset.entries
            .map((searchResult, index) => {
              if (options?.withAnnotations) {
                return {
                  ...SearchResultTransformerComplete(searchResult, index),
                  ...(AnnotationsTransformer(searchResult.savedItem) ?? {}),
                };
              } else {
                return SearchResultTransformerComplete(searchResult, index);
              }
            })
            .filter((s) => s !== null),
          'item_id',
        );
  return {
    ...searchStatusResponse(response),
    ...TagListTransformer(response.user.tagsList),
    ...staticV3ResponseDefaults,
    list,
    ...searchMetaTransformer(response),
  };
}

/**
 * Convert GraphQL response for detailType=complete and search=<some term> to v3 API
 * format, adding top-level total field.
 */
export function searchSavedItemSimpleTotalToRest(
  response: SearchSavedItemsSimpleQuery,
  options?: { withAnnotations?: boolean },
): GetSearchResponseSimpleTotal {
  return {
    ...searchSavedItemSimpleToRest(response, options),
    total: response.user.searchSavedItemsByOffset.totalCount.toString(),
  };
}

/**
 * Convert GraphQL response for detailType=complete and search=<some term> to v3 API
 * format, adding top-level total field.
 */
export function searchSavedItemCompleteTotalToRest(
  response: SearchSavedItemsCompleteQuery,
  options?: { withAnnotations?: boolean },
): GetSearchResponseCompleteTotal {
  return {
    ...searchSavedItemCompleteToRest(response, options),
    total: response.user.searchSavedItemsByOffset.totalCount.toString(),
  };
}
