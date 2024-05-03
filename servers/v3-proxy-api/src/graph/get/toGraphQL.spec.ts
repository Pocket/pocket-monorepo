//add unit test for input type mapping
import { setSavedItemsVariables, setSearchVariables } from './toGraphQL.js';
import {
  SavedItemsSortBy,
  SavedItemsSortOrder,
  SearchItemsSortBy,
} from '../../generated/graphql/index.js';
import { defaultQuery, defaultSearchQuery } from '../../test/fixtures/index.js';

describe('toGraphQL', () => {
  describe('get saved items', () => {
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
      };
      expect(setSavedItemsVariables(defaultQuery)).toEqual(expected);
    });
    describe('filter object', () => {
      it.each([
        {
          params: { since: 123456 },
          expected: { filter: { updatedSince: 123456 } },
        },
        {
          params: { updatedBefore: 123456 },
          expected: { filter: { updatedBefore: 123456 } },
        },
        {
          params: { state: 'all' as const },
          expected: {},
        },
        {
          params: { favorite: true, tag: 'recipe' },
          expected: { filter: { isFavorite: true, tagNames: ['recipe'] } },
        },
        {
          params: { contentType: 'video' as const },
          expected: {
            filter: {
              contentType: 'HAS_VIDEO_INCLUSIVE',
            },
          },
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
        {
          params: {
            hasAnnotations: true,
          },
          expected: {
            filter: {
              isHighlighted: true,
            },
          },
        },
      ])(
        'maps filters appropriately, including combos',
        ({ params, expected }) => {
          const actual = setSavedItemsVariables({
            ...defaultQuery,
            ...params,
          });
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
        const actual = setSavedItemsVariables({
          ...defaultQuery,
          ...params,
        });
        expect(actual).toMatchObject(expected);
      });
    });
  });
  describe('search', () => {
    it('should map minimal input (default values)', () => {
      const expected = {
        pagination: {
          limit: 30,
          offset: 0,
        },
        sort: {
          sortBy: SearchItemsSortBy.Relevance,
          sortOrder: SavedItemsSortOrder.Desc,
        },
        term: 'abc',
      };
      expect(setSearchVariables(defaultSearchQuery)).toEqual(expected);
    });
    describe('sort', () => {
      it.each([
        {
          sort: 'newest' as const,
          expected: {
            sort: {
              sortBy: 'CREATED_AT',
              sortOrder: 'DESC',
            },
          },
        },
        {
          sort: 'oldest' as const,
          expected: {
            sort: {
              sortBy: 'CREATED_AT',
              sortOrder: 'ASC',
            },
          },
        },
        {
          sort: 'relevance' as const,
          expected: {
            sort: {
              sortBy: 'RELEVANCE',
              sortOrder: 'DESC',
            },
          },
        },
      ])('maps sort as expected', ({ sort, expected }) => {
        const actual = setSearchVariables({
          ...defaultQuery,
          sort,
        });
        expect(actual).toMatchObject(expected);
      });
    });
    describe('filter', () => {
      it.each([
        {
          params: {
            state: 'read' as const,
            tag: 'hello', // unused
            contentType: 'article' as const,
          },
          expected: {
            filter: {
              status: 'ARCHIVED',
              contentType: 'ARTICLE',
            },
          },
        },
        {
          params: {
            state: 'unread' as const,
            domain: 'youtube.com',
            contentType: 'video' as const,
          },
          expected: {
            filter: {
              status: 'UNREAD',
              contentType: 'VIDEO',
              domain: 'youtube.com',
            },
          },
        },
        {
          params: {
            favorite: true,
          },
          expected: {
            filter: {
              isFavorite: true,
            },
          },
        },
        {
          params: { state: 'all' as const },
          expected: {},
        },
      ])(
        'maps filter as expected, including combos and unused',
        ({ params, expected }) => {
          const actual = setSearchVariables({
            ...defaultSearchQuery,
            ...params,
          });
          expect(actual).toMatchObject(expected);
        },
      );
    });
  });
});
