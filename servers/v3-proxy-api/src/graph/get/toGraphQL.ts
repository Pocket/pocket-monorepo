/**
 * methods that converts REST inputs/query params to graphQL inputs
 */
import {
  SavedItemsContentType,
  SavedItemsFilter,
  SavedItemsSort,
  SavedItemsSortBy,
  SavedItemsSortOrder,
  SavedItemStatusFilter,
  SearchFilterInput,
  SearchItemsContentType,
  SearchItemsSortBy,
  SearchItemsSortOrder,
  SearchItemsStatusFilter,
  SearchSortInput,
  UserSavedItemsByOffsetArgs,
  UserSearchSavedItemsByOffsetArgs,
} from '../../generated/graphql/types';
import { V3GetParams } from '../../routes/validations/GetSchema';

/**
 * Build GraphQL SavedItemsSortInput values from
 * /v3/get query parameters.
 */
export function SavedItemsSortFactory(params: V3GetParams) {
  // relevance is only a valid sort if search term is included
  // removed legacy sorts (<100 requests over the past year):
  //    - title
  //    - site
  const orderMap = {
    newest: SavedItemsSortOrder.Desc,
    oldest: SavedItemsSortOrder.Asc,
  };
  // Web repo logic:
  //   If since is populated, don't sort favorited/archived items by favoritedAt/archivedAt
  //   If both favorite and archived are populated, default to favorite
  //   (from a UI perspective this screen does not exist on web - favorite + archive)
  let sortBy = SavedItemsSortBy.CreatedAt; // default
  if (params.since == null) {
    if (params.favorite != null) {
      sortBy = SavedItemsSortBy.FavoritedAt;
    } else if (
      params.state &&
      ['read', 'archived'].indexOf(params.state) > -1
    ) {
      sortBy = SavedItemsSortBy.ArchivedAt;
    }
  }
  const sort: SavedItemsSort = {
    sortBy,
    sortOrder: orderMap[params.sort],
  };
  return Object.freeze(sort);
}

/**
 * Build GraphQL SavedItemsSortInput values from
 * /v3/get query parameters.
 */
export function SearchSortFactory(params: V3GetParams) {
  // relevance is only a valid sort if search term is included
  // removed legacy sorts (<100 requests over the past year):
  //    - title
  //    - site

  const orderMap = {
    newest: SearchItemsSortOrder.Desc,
    oldest: SearchItemsSortOrder.Asc,
    relevance: SearchItemsSortOrder.Desc,
  };
  const columnMap = {
    newest: SearchItemsSortBy.CreatedAt,
    oldest: SearchItemsSortBy.CreatedAt,
    relevance: SearchItemsSortBy.Relevance,
  };

  const sort: SearchSortInput = {
    sortBy: columnMap[params.sort],
    sortOrder: orderMap[params.sort],
  };
  return Object.freeze(sort);
}

/**
 * Build SavedItemsFilterInput from v3/get query parameters
 * Does not include the following legacy filters
 * (0-1 requests in past year as of 2024-02-23)
 *    - updatedBefore
 *    - newFrom (synonym for 'since')
 *    - hasAnnotations
 *    - shared (feature deprecated)
 *    - item
 *    - items
 *   values for state:
 *    - anyactive
 *    - hasmeta
 *    - hasattribution
 *    - hasposts
 *    - hasannotations
 *    - hasdomainmetadata
 *    - hasvideos
 *    - pending
 */
export function SavedItemsFilterFactory(params: V3GetParams) {
  // Mappings of V3 key/value pairs to SavedItemFilterInput
  const transformers = {
    favorite: (val: string) => ({ isFavorite: val }),
    contentType: (val: string) => {
      const contentMap = {
        video: { contentType: SavedItemsContentType.HasVideoInclusive },
        article: { contentType: SavedItemsContentType.IsReadable },
        image: { contentType: SavedItemsContentType.IsImage },
      };
      return contentMap[val];
    },
    state: (val: string) => {
      const stateMap = {
        unread: { status: SavedItemStatusFilter.Unread },
        queue: { status: SavedItemStatusFilter.Unread },
        archive: { status: SavedItemStatusFilter.Archived },
        read: { status: SavedItemStatusFilter.Archived },
        // "all" is implicit -- the absence of a filter value
        all: undefined,
      };
      return stateMap[val];
    },
    since: (val: number) => ({ updatedSince: val }),
    tag: (val: string) => ({ tagNames: [val] }),
    hasAnnotations: (val: boolean) => ({ isHighlighted: val }),
  };

  const filter: SavedItemsFilter = Object.entries(params).reduce(
    (filter, [key, value]) => {
      // If the parameter key has a transformer (aka is a valid filter),
      // add it to the filter object
      if (transformers[key] != null) {
        const result = transformers[key](value);
        if (result != null) {
          // ... as long as the value is not null/undefined
          Object.assign(filter, result);
        }
      }
      return filter;
    },
    {} as SavedItemsFilter,
  );
  return Object.freeze(filter);
}

export function SearchFilterFactory(params: V3GetParams) {
  // Mappings of V3 key/value pairs to SearchFilterInput
  const transformers = {
    favorite: (val: string) => ({ isFavorite: val }),
    contentType: (val: string) => {
      const contentMap = {
        article: { contentType: SearchItemsContentType.Article },
        video: { contentType: SearchItemsContentType.Video },
      };
      return contentMap[val];
    },
    domain: (val: string) => ({ domain: val }),
    state: (val: string) => {
      const stateMap = {
        unread: { status: SearchItemsStatusFilter.Unread },
        queue: { status: SearchItemsStatusFilter.Unread },
        archive: { status: SearchItemsStatusFilter.Archived },
        read: { status: SearchItemsStatusFilter.Archived },
        // "all" is implicit -- the absence of a filter value
        all: undefined,
      };
      return stateMap[val];
    },
  };

  const filter: SearchFilterInput = Object.entries(params).reduce(
    (filter, [key, value]) => {
      // If the parameter key has a transformer (aka is a valid filter),
      // add it to the filter object
      if (transformers[key] != null) {
        const result = transformers[key](value);
        if (result != null) {
          // ... as long as the value is not null/undefined
          Object.assign(filter, result);
        }
      }
      return filter;
    },
    {} as SearchFilterInput,
  );
  return Object.freeze(filter);
}

export function setSavedItemsVariables(
  requestParams: V3GetParams,
): UserSavedItemsByOffsetArgs {
  const filter = SavedItemsFilterFactory(requestParams);
  const sort = SavedItemsSortFactory(requestParams);
  const variables = {
    pagination: {
      limit: requestParams.count,
      offset: requestParams.offset,
    },
    sort,
  };
  // Attach filter only if not empty
  if (Object.keys(filter).length) {
    variables['filter'] = filter;
  }
  return variables;
}

export function setSearchVariables(
  requestParams: V3GetParams,
): UserSearchSavedItemsByOffsetArgs {
  const sort = SearchSortFactory(requestParams);
  const filter = SearchFilterFactory(requestParams);

  const variables = {
    term: requestParams.search,
    pagination: {
      limit: requestParams.count,
      offset: requestParams.offset,
    },
    sort,
  };
  // Attach filter only if not empty
  if (Object.keys(filter).length) {
    variables['filter'] = filter;
  }
  return variables;
}
