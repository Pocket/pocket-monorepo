/**
 * methods that converts REST inputs/query params to graphQL inputs
 */
import {
  SavedItemsSortBy,
  SavedItemsSortOrder,
  SavedItemStatusFilter,
  UserSavedItemsByOffsetArgs,
} from '../generated/graphql/types';

export function setSaveInputsFromGetCall(
  requestParams: any,
): UserSavedItemsByOffsetArgs {
  //todo: stubbed for skeleton
  //to be replaced by actual mapping in following tickets
  return {
    pagination: {
      limit: parseInt(requestParams.count ?? '30'),
      offset: parseInt(requestParams.offset ?? '0'),
    },
    sort: {
      sortBy: SavedItemsSortBy.UpdatedAt,
      sortOrder: SavedItemsSortOrder.Asc,
    },
    filter: {
      status: SavedItemStatusFilter.Unread,
    },
  };
}
