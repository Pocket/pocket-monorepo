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
  UserSavedItemsByOffsetArgs,
} from '../generated/graphql/types';
import { V3GetParams } from '../routes/validations';

/**
 * Build GraphQL SavedItemsSortInput values from
 * /v3/get query parameters.
 */
export class Sort<T extends V3GetParams> {
  // relevance is only a valid sort if search term is included
  // removed legacy sorts (<100 requests over the past year):
  //    - title
  //    - site
  private sort: SavedItemsSort;
  static orderMap = {
    newest: SavedItemsSortOrder.Desc,
    oldest: SavedItemsSortOrder.Asc,
    // todo: relevance
  };

  constructor(params: T) {
    // Web repo logic:
    //   If since is populated, don't sort favorited/archived items by favoritedAt/archivedAt
    //   If both favorite and archived are populated, default to favorite
    //   (from a UI perspective this screen does not exist - favorite + archive)
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
    this.sort = {
      sortBy,
      sortOrder: Sort.orderMap[params.sort],
    };
  }
  public toObject() {
    return Object.freeze(this.sort);
  }
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
export class Filter {
  // Mappings of V3 key/value pairs to SavedItemFilterInput
  static transformers = {
    favorite: (val: string) => ({ isFavorite: val }),
    contentType: (val: string) => {
      const contentMap = {
        // video contentType TODO: Pocket-9660
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
  };

  private filter: SavedItemsFilter;

  constructor(params: any) {
    this.filter = Object.entries(params).reduce((filter, [key, value]) => {
      // If the parameter key has a transformer (aka is a valid filter),
      // add it to the filter object
      if (Filter.transformers[key] != null) {
        const result = Filter.transformers[key](value);
        if (result != null) {
          // ... as long as the value is not null/undefined
          Object.assign(filter, result);
        }
      }
      return filter;
    }, {} as SavedItemsFilter);
  }
  public toObject() {
    return Object.freeze(this.filter);
  }
}

export function setSaveInputsFromGetCall<T extends V3GetParams>(
  requestParams: T,
): UserSavedItemsByOffsetArgs {
  const filter = new Filter(requestParams).toObject();
  const sort = new Sort(requestParams).toObject();
  return {
    pagination: {
      limit: requestParams.count,
      offset: requestParams.offset,
    },
    sort,
    filter,
  };
}
