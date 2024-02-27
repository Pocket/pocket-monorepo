//add unit test for input type mapping
import { setSaveInputsFromGetCall } from './toGraphQL';
import {
  SavedItemsSortBy,
  SavedItemsSortOrder,
} from '../generated/graphql/types';
import { defaultQuery } from '../test/fixtures';

describe('toGraphQL', () => {
  it('should map saves input', () => {
    const expected = {
      pagination: {
        limit: 30,
        offset: 0,
      },
      sort: {
        sortBy: SavedItemsSortBy.CreatedAt,
        sortOrder: SavedItemsSortOrder.Desc,
      },
      filter: {},
    };
    expect(setSaveInputsFromGetCall(defaultQuery)).toEqual(expected);
  });
  describe('filter object', () => {
    // Need to see how Express handles this
    it.todo('handles duplicate query parameters');
    it.each([
      {
        params: { since: 123456 },
        expected: { filter: { updatedSince: 123456 } },
      },
      {
        params: { state: 'all' as const },
        expected: { filter: {} },
      },
      {
        params: { favorite: true, tag: 'recipe' },
        expected: { filter: { isFavorite: true, tagNames: ['recipe'] } },
      },
      {
        params: {
          state: 'read' as const,
          unused: 'hello',
          contentType: 'article' as const,
        },
        expected: {
          filter: {
            status: 'ARCHIVED',
            contentType: 'IS_READABLE',
          },
        },
      },
    ])(
      'maps filters appropriately, including combos',
      ({ params, expected }) => {
        const actual = setSaveInputsFromGetCall({ ...defaultQuery, ...params });
        console.log(JSON.stringify(actual, null, 2));
        expect(actual).toMatchObject(expected);
      },
    );
  });
  describe('sort', () => {
    it.each([
      {
        params: { since: 123456 },
        expected: { sort: { sortBy: 'CREATED_AT', sortOrder: 'DESC' } },
      },
      {
        params: {
          favorite: true,
          tag: 'recipe',
          sort: 'newest' as const,
        },
        expected: { sort: { sortBy: 'FAVORITED_AT', sortOrder: 'DESC' } },
      },
      {
        // "favorite"" overriden by "since"
        params: { since: 123456, favorite: true },
        expected: { sort: { sortBy: 'CREATED_AT', sortOrder: 'DESC' } },
      },
      {
        // "archive" overridden by "favorite"
        params: {
          favorite: false,
          state: 'read' as const,
          sort: 'oldest' as const,
        },
        expected: {
          sort: {
            sortBy: 'FAVORITED_AT',
            sortOrder: 'ASC',
          },
        },
      },
      {
        params: {
          state: 'read' as const,
          sort: 'newest' as const,
        },
        expected: {
          sort: {
            sortBy: 'ARCHIVED_AT',
            sortOrder: 'DESC',
          },
        },
      },
      {
        params: {
          state: 'read' as const,
          sort: 'oldest' as const,
        },
        expected: {
          sort: {
            sortBy: 'ARCHIVED_AT',
            sortOrder: 'ASC',
          },
        },
      },
    ])('creates appropriate sort', ({ params, expected }) => {
      const actual = setSaveInputsFromGetCall({
        ...defaultQuery,
        ...params,
      });
      expect(actual).toMatchObject(expected);
    });
  });
});
