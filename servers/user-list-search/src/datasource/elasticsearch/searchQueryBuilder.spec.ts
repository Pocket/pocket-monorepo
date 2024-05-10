import {
  AdvancedSearchFilters,
  SearchItemsContentType,
  SearchItemsSortBy,
  SearchItemsSortOrder,
  SearchItemsStatusFilter,
  UserAdvancedSearchArgs,
} from '../../__generated__/types';
import { SearchQueryBuilder } from './searchQueryBuilder';

describe('SearchQueryBuilder', () => {
  const query = new SearchQueryBuilder();
  const userId = '1';
  describe('filters', () => {
    const testCases: {
      name: string;
      filter: AdvancedSearchFilters;
      expected: any;
    }[] = [
      {
        name: 'one tag',
        filter: { tags: ['solar'] },
        expected: {
          filter: {
            bool: {
              must: expect.toIncludeSameMembers([
                { term: { user_id: 1 } },
                { term: { 'tags.keyword': 'solar' } },
              ]),
            },
          },
        },
      },
      {
        name: 'multiple tags',
        filter: { tags: ['solar', 'abyssal'] },
        expected: {
          filter: {
            bool: {
              must: expect.toIncludeSameMembers([
                { term: { user_id: 1 } },
                { terms: { 'tags.keyword': ['solar', 'abyssal'] } },
              ]),
            },
          },
        },
      },
      {
        name: 'isFavorite',
        filter: { isFavorite: true },
        expected: {
          filter: {
            bool: {
              must: expect.toIncludeSameMembers([
                { term: { user_id: 1 } },
                { term: { favorite: true } },
              ]),
            },
          },
        },
      },
      {
        name: 'domain',
        filter: { domain: 'theonyxpath.com' },
        expected: {
          filter: {
            bool: {
              must: expect.toIncludeSameMembers([
                { term: { user_id: 1 } },
                {
                  wildcard: { 'url.keyword': { value: '*theonyxpath.com*' } },
                },
              ]),
            },
          },
        },
      },
      // Right now just supporting match, not match_phrase
      // Could do a query string in the future
      {
        name: 'title',
        filter: { title: 'solar exalted' },
        expected: {
          filter: {
            bool: {
              must: expect.toIncludeSameMembers([
                { term: { user_id: 1 } },
                {
                  match: {
                    title: { query: 'solar exalted', fuzziness: 'AUTO' },
                  },
                },
              ]),
            },
          },
        },
      },
      {
        name: 'status',
        filter: { status: SearchItemsStatusFilter.Archived },
        expected: {
          filter: {
            bool: {
              must: expect.toIncludeSameMembers([
                { term: { user_id: 1 } },
                { term: { status: 'archived' } },
              ]),
            },
          },
        },
      },
      {
        name: 'contentType',
        filter: { contentType: SearchItemsContentType.Video },
        expected: {
          filter: {
            bool: {
              must: expect.toIncludeSameMembers([
                { term: { user_id: 1 } },
                { term: { content_type: 'video' } },
              ]),
            },
          },
        },
      },
      {
        name: 'all filters',
        filter: {
          tags: ['solar', 'abyssal'],
          isFavorite: true,
          domain: 'theonyxpath.com',
          title: 'solar exalted',
          status: SearchItemsStatusFilter.Archived,
          contentType: SearchItemsContentType.Video,
        },
        expected: {
          filter: {
            bool: {
              must: expect.toIncludeSameMembers([
                { term: { user_id: 1 } },
                { terms: { 'tags.keyword': ['solar', 'abyssal'] } },
                {
                  match: {
                    title: { query: 'solar exalted', fuzziness: 'AUTO' },
                  },
                },
                {
                  wildcard: { 'url.keyword': { value: '*theonyxpath.com*' } },
                },
                { term: { favorite: true } },
                {
                  term: { content_type: 'video' },
                },
                {
                  term: { status: 'archived' },
                },
              ]),
            },
          },
        },
      },
    ];
    it.each(testCases)(
      'builds appropriate filters - $name',
      ({ filter, expected }) => {
        const actual = query.parse({ filter }, userId);
        expect((actual.query as any).bool).toMatchObject(expected);
      },
    );
  });
  describe('query string', () => {
    it('replaces AND, OR, and NOT operators with +,|,- respectively', () => {
      const input: UserAdvancedSearchArgs = {
        queryString: 'void AND solar OR abyssal NOT lunar',
      };
      const expected = {
        query: expect.objectContaining({
          bool: expect.objectContaining({
            must: {
              simple_query_string: expect.objectContaining({
                query: 'void + solar | abyssal -lunar',
              }),
            },
          }),
        }),
      };
      const actual = query.parse(input, userId);
      expect(actual).toMatchObject(expected);
    });
    it.each([
      {
        name: 'no filters',
        input: { queryString: 'void circle' },
        fields: ['title^10', 'full_text', 'url.keyword^2'],
      },
      {
        name: 'title filter',
        input: {
          queryString: 'void circle',
          filter: { title: 'sworn to the grave' },
        },
        fields: ['full_text', 'url.keyword^2'],
      },
      {
        name: 'title and url filters',
        input: {
          queryString: 'void circle',
          filter: { title: 'sworn to the grave', domain: 'onyxpath' },
        },
        fields: ['full_text'],
      },
    ])('queries fields depending on filters: $name', ({ input, fields }) => {
      const expected = {
        query: {
          bool: expect.objectContaining({
            must: {
              simple_query_string: {
                query: 'void circle',
                analyze_wildcard: true,
                fields: expect.toIncludeSameMembers(fields),
                flags: 'OR|AND|NOT|PHRASE|PRECEDENCE|WHITESPACE|PREFIX',
              },
            },
          }),
        },
      };
      const actual = query.parse(input, userId);
      expect(actual).toMatchObject(expected);
    });
  });
  describe('parse', () => {
    it('builds with query string and filters', () => {
      const input: UserAdvancedSearchArgs = {
        queryString: '"reed in the wind" AND solar OR abyssal',
        filter: {
          tags: ['solar', 'abyssal'],
          isFavorite: true,
          domain: 'theonyxpath.com',
          title: 'solar exalted',
        },
      };
      const expected = expect.objectContaining({
        query: {
          bool: {
            must: {
              simple_query_string: {
                analyze_wildcard: true,
                query: '"reed in the wind" + solar | abyssal',
                fields: ['full_text'],
                flags: 'OR|AND|NOT|PHRASE|PRECEDENCE|WHITESPACE|PREFIX',
              },
            },
            filter: {
              bool: {
                must: expect.toIncludeSameMembers([
                  {
                    terms: {
                      'tags.keyword': expect.toIncludeSameMembers([
                        'solar',
                        'abyssal',
                      ]),
                    },
                  },
                  {
                    match: {
                      title: { query: 'solar exalted', fuzziness: 'AUTO' },
                    },
                  },
                  {
                    wildcard: {
                      'url.keyword': { value: '*theonyxpath.com*' },
                    },
                  },
                  { term: { favorite: true } },
                  { term: { user_id: 1 } },
                ]),
              },
            },
          },
        },
      });
      const actual = query.parse(input, userId);
      expect(actual).toEqual(expected);
    });
    it('builds with filters alone', () => {
      const input: UserAdvancedSearchArgs = {
        filter: {
          tags: ['solar', 'abyssal'],
        },
      };
      const expected = {
        query: {
          bool: {
            filter: {
              bool: {
                must: [
                  {
                    terms: { 'tags.keyword': ['solar', 'abyssal'] },
                  },
                  {
                    term: { user_id: 1 },
                  },
                ],
              },
            },
          },
        },
      };
      const actual = query.parse(input, userId);
      expect(actual).toMatchObject(expected);
    });
    it('builds with query string alone', () => {
      const input: UserAdvancedSearchArgs = {
        queryString: '"reed in the wind" AND solar OR abyssal',
      };
      const expected = {
        query: {
          bool: expect.objectContaining({
            must: {
              simple_query_string: {
                query: '"reed in the wind" + solar | abyssal',
                analyze_wildcard: true,
                fields: expect.toIncludeSameMembers([
                  'full_text',
                  'title^10',
                  'url.keyword^2',
                ]),
                flags: 'OR|AND|NOT|PHRASE|PRECEDENCE|WHITESPACE|PREFIX',
              },
            },
          }),
        },
      };
      const actual = query.parse(input, userId);
      expect(actual).toMatchObject(expected);
    });
  });
  describe('sort', () => {
    it('defaults to sorting by _score with item_id tiebreaker', () => {
      const input: UserAdvancedSearchArgs = {
        queryString: '"reed in the wind" AND solar OR abyssal',
      };
      const actual = query.parse(input, userId);
      const expected = {
        sort: ['_score', { item_id: 'asc' }],
      };
      expect(actual).toMatchObject(expected);
    });
    it('includes custom sort', () => {
      const input: UserAdvancedSearchArgs = {
        queryString: '"reed in the wind" AND solar OR abyssal',
        sort: {
          sortBy: SearchItemsSortBy.CreatedAt,
          sortOrder: SearchItemsSortOrder.Asc,
        },
      };
      const actual = query.parse(input, userId);
      const expected = {
        sort: [{ date_added: 'asc' }, { item_id: 'asc' }],
      };
      expect(actual).toMatchObject(expected);
    });
  });
  describe('pagination', () => {
    it('constructs search_after query if after is provided', () => {
      const input: UserAdvancedSearchArgs = {
        queryString: '"reed in the wind" AND solar OR abyssal',
        pagination: { first: 10, after: 'MTAwX18rX18z' },
      };
      const actual = query.parse(input, userId);
      const expected = {
        size: 10,
        search_after: ['100', '3'],
      };
      expect(actual).toMatchObject(expected);
    });
    it('adds limit to query by default', () => {
      const input: UserAdvancedSearchArgs = {
        queryString: '"reed in the wind" AND solar OR abyssal',
      };
      const actual = query.parse(input, userId);
      const expected = {
        size: expect.toBeNumber(),
      };
      expect(actual).toMatchObject(expected);
    });
    it('adds custom limit if first is provided', () => {
      const input: UserAdvancedSearchArgs = {
        queryString: '"reed in the wind" AND solar OR abyssal',
        pagination: { first: 10 },
      };
      const actual = query.parse(input, userId);
      const expected = {
        size: 10,
      };
      expect(actual).toMatchObject(expected);
    });
  });
});
