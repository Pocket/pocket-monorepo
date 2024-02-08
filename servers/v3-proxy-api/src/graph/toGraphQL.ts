/**
 * methods that converts REST inputs/query params to graphQL inputs
 */
import {
  SavedItemsSortBy,
  SavedItemsSortOrder,
  SavedItemStatusFilter,
  UserSavedItemsArgs,
} from '../generated/graphql/types';

export function setSaveInputsFromGetCall(
  requestParams: any
): UserSavedItemsArgs {
  //todo: stubbed for skeleton
  //to be replaced by actual mapping in following tickets
  return {
    pagination: {
      first: 10,
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
