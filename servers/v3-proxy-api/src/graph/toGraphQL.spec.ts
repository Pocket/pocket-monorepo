//add unit test for input type mapping
import { setSaveInputsFromGetCall } from './toGraphQL';
import {
  SavedItemsSortBy,
  SavedItemsSortOrder,
  SavedItemStatusFilter,
} from '../generated/graphql/types';

describe('toGraphQL', () => {
  //todo: refactor this test as you refactor the method
  it('should map saves input', () => {
    const expected = {
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
    expect(setSaveInputsFromGetCall('sample-rest-params')).toEqual(expected);
  });
});
