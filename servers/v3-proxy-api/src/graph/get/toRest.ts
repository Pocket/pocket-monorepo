/**
 * method to convert graph responses to REST responses
 */

import {
  AccountFieldsFragment,
  PremiumFeature,
  PremiumStatus,
  RecentSearchFieldsFragment,
  SavedItemsCompleteQuery,
  SavedItemsSimpleQuery,
  SearchSavedItemsCompleteQuery,
  SearchSavedItemsSimpleQuery,
} from '../../generated/graphql';
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
  AccountResponse,
  PremiumFeatures,
  RecentSearchResponse,
} from '../types';
import * as tx from '../shared/transforms';
import { DateTime } from 'luxon';

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
      since: Math.round(new Date().getTime() / 1000),
    };
  }

  return {
    status: response.user.savedItemsByOffset.totalCount > 0 ? 1 : 2,
    error: null,
    complete: 1,
    since: Math.round(new Date().getTime() / 1000),
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
      since: Math.round(new Date().getTime() / 1000),
    };
  }

  return {
    status: response.user.searchSavedItemsByOffset.totalCount > 0 ? 1 : 2,
    error: null,
    complete: 1,
    since: Math.round(new Date().getTime() / 1000),
  };
}

function RecentSearchesTransformer(
  data: Partial<RecentSearchFieldsFragment>,
): RecentSearchResponse | Record<never, never> {
  if (data.recentSearches == null) return {};
  const recentSearches = data.recentSearches.map((search) => {
    return {
      search: search.term,
      context_key: search.context?.key ?? '',
      context_value: search.context?.value ?? '',
      sort_id: (search.sortId + 1).toString(),
    };
  });
  return { recent_searches: recentSearches };
}

function AccountTransformer(
  accountData: Partial<AccountFieldsFragment>,
): AccountResponse | Record<never, never> {
  // Short-circuit if data is not present
  if (accountData?.id == null) return {};
  const firstName = accountData.firstName ?? '';
  const lastName = accountData.lastName ?? '';
  return {
    account: {
      user_id: accountData.id,
      username: '', // omitted - included for shape only
      email: accountData.email,
      birth: DateTime.fromISO(accountData.accountCreationDate)
        .setZone('US/Central')
        .toFormat('yyyy-MM-dd HH:mm:ss'),
      first_name: firstName,
      last_name: lastName,
      premium_status: accountData.isPremium ? '1' : '0',
      is_fxa: accountData.isFxa ? 'true' : 'false',
      aliases: {
        [accountData.email]: {
          email: accountData.email,
          confirmed: '1',
        },
      },
      profile: {
        username: accountData.username ?? null,
        name: [firstName, lastName].join(' ').trim(),
        description: accountData.description ?? '',
        avatar_url: accountData.avatarUrl,
        follower_count: '0', // unused
        follow_count: '0', // unused
        is_following: '0', // unused
        uid: accountData.id,
        type: 'pocket' as const, // static value
        sort_id: 1, // static value
      },
      premium_features:
        accountData.premiumFeatures?.map((feat) =>
          PremiumFeatureTransformer(feat),
        ) ?? [],
      premium_alltime_status: AlltimeStatusTransformer(
        accountData.premiumStatus,
      ),
      premium_on_trial: '0', // unused
      ...(!accountData.isPremium && { annotations_per_article_limit: 3 }), // Hardcode alert
    },
  };
}

function PremiumFeatureTransformer(feat: PremiumFeature): PremiumFeatures {
  const featureNameMap = {
    [PremiumFeature.AdFree]: 'ad_free',
    [PremiumFeature.Annotations]: 'annotations',
    [PremiumFeature.PermanentLibrary]: 'library',
    [PremiumFeature.SuggestedTags]: 'suggested_tags',
    [PremiumFeature.PremiumSearch]: 'premium_search',
  } as Record<PremiumFeature, PremiumFeatures>;
  return featureNameMap[feat];
}

function AlltimeStatusTransformer(status: PremiumStatus): string {
  const statusMap = {
    [PremiumStatus.Never]: '0',
    [PremiumStatus.Active]: '1',
    [PremiumStatus.Expired]: '2',
  };
  return statusMap[status];
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
): { tags: string[] } | Record<string, never> {
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
  const tags = tx.TagsReducer(savedItem.tags, savedItem.id);
  tags != null && (conditionalFields['tags'] = tags);
  switch (savedItem.item.__typename) {
    case 'PendingItem':
      // This case shouldn't happen, but we set values to defaults
      // if there isn't an item
      return {
        ...baseFields,
        resolved_id: '',
        given_url: savedItem.url,
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
    ...AccountTransformer(response.user),
    ...RecentSearchesTransformer(response.user),
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
    ...AccountTransformer(response.user),
    ...RecentSearchesTransformer(response.user),
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
    ...AccountTransformer(response.user),
    ...RecentSearchesTransformer(response.user),
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
    ...AccountTransformer(response.user),
    ...RecentSearchesTransformer(response.user),
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
