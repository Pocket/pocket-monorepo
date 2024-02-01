import { config } from './config';
import { bulkDocument } from './datasource/elasticsearch/elasticsearchBulk';
import { client } from './datasource/elasticsearch';
import { startServer } from './server/serverUtils';
import { ContextManager } from './server/context';
import { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { knexDbClient } from './datasource/clients/knexClient';
import { Knex } from 'knex';
import { loadItemExtended, loadList } from './searchIntegrationTestHelpers';
import { SavedItemStatus } from './types';

const defaultDocProps = {
  resolved_id: 1,
  url: '',
  full_text: '',
  excerpt: '',
  domain_id: 1,
  content_type: ['web'],
  word_count: 1,
  favorite: false,
  status: 'queued',
  lang: 'en',
};

async function loadUserItem(
  item: {
    item_id: number;
    url: string;
    favorite: boolean;
    title: string;
    date_added: string;
    user_id: number;
    tags: string[];
    date_published: string;
    full_text: string;
    status?: string;
    word_count: number;
    content_type?: string[];
  },
  db: Knex
) {
  const merged = {
    ...defaultDocProps,
    ...item,
  };

  await loadList(
    db,
    merged.favorite ? 1 : 0,
    merged.item_id,
    // The use case here only needs to support queued and archived, so not getting fancy.
    merged.status == 'queued'
      ? SavedItemStatus.UNREAD
      : SavedItemStatus.ARCHIVED,
    merged.title,
    merged.url,
    new Date(merged.date_added)
  );
  await loadItemExtended(
    db,
    merged.item_id,
    merged.url,
    merged.title,
    merged.word_count
  );

  return await bulkDocument([
    {
      action: 'index',
      ...merged,
    },
  ]);
}

describe('premium search functional test', () => {
  const testEsClient = client;
  let app: Express;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const db = knexDbClient();
  const headers = {
    userid: '1',
    premium: 'true',
  };
  const SEARCH_SAVED_ITEM_QUERY = `
    query searchSavedItem(
      $id: ID!
      $term: String!
      $filter: SearchFilterInput
      $sort: SearchSortInput
      $pagination: PaginationInput
    ) {
      _entities(representations: { id: $id, __typename: "User" }) {
        ... on User {
          searchSavedItems(
            term: $term
            filter: $filter
            sort: $sort
            pagination: $pagination
          ) {
            edges {
              cursor
              node {
                savedItem {
                  id
                }
                searchHighlights {
                  tags
                  fullText
                  title
                }
              }
            }
            pageInfo {
              startCursor
              endCursor
              hasNextPage
              hasPreviousPage
            }
            totalCount
          }
        }
      }
    }
  `;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
    await testEsClient.deleteByQuery({
      index: config.aws.elasticsearch.index,
      type: config.aws.elasticsearch.type,
      body: {
        query: {
          match_all: {},
        },
      },
    });

    await db('readitla_ril-tmp.list').truncate();
    await db('readitla_b.items_extended').truncate();

    const items = [
      loadUserItem(
        {
          item_id: 12345,
          url: 'http://test1.com',
          favorite: true,
          title: 'A super fun article',
          date_added: '2020-07-27T20:17:33.019Z',
          user_id: 1,
          tags: ['fun', 'super', 'common'],
          date_published: '2020-07-27T20:17:33.019Z',
          full_text: 'some text that can be used for article highlights',
          word_count: 10,
          content_type: ['article'],
        },
        db
      ),
      loadUserItem(
        {
          item_id: 123,
          url: 'http://test2.com',
          favorite: true,
          title: 'Another fun article',
          date_added: '2021-06-27T20:17:33.019Z',
          user_id: 1,
          tags: ['fun', 'coffee'],
          status: 'queued',
          date_published: '2020-06-27T20:17:33.019Z',
          full_text: 'some text that can be used for article highlights',
          word_count: 50,
          content_type: ['article'],
        },
        db
      ),
      loadUserItem(
        {
          item_id: 456,
          url: 'http://test3.com',
          favorite: true,
          title: 'snowboarding fun article',
          date_added: '2021-05-27T20:17:33.019Z',
          user_id: 1,
          status: 'archived',
          tags: ['snow', 'snowboard', 'article'],
          date_published: '2021-05-27T20:17:33.019Z',
          full_text: 'not related to search',
          word_count: 100,
          content_type: ['article'],
        },
        db
      ),
      loadUserItem(
        {
          item_id: 789,
          url: 'http://winter.com',
          favorite: true,
          title: 'winter skating fun article',
          date_added: '2020-10-27T20:17:33.019Z',
          user_id: 1,
          tags: ['fun', 'skating'],
          status: 'queued',
          content_type: ['video'],
          date_published: '2020-10-27T20:17:33.019Z',
          full_text: 'winter sports article',
          word_count: 500,
        },
        db
      ),
      loadUserItem(
        {
          item_id: 777,
          url: 'http://everythingmusic.com',
          favorite: true,
          title: 'Bigfoot band article',
          date_added: '2020-10-27T20:17:33.019Z',
          user_id: 1,
          tags: ['cryptid fun'], // a multi-word tag that overlaps with single-word tag
          status: 'queued',
          date_published: '2020-10-27T20:17:33.019Z',
          full_text: 'Bigfoot band gets foothold in stomp scene',
          word_count: 500,
        },
        db
      ),
    ];

    await Promise.all(items);

    // Takes a hot sec for the data to be available, otherwise test flakes
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });

  afterAll(async () => {
    await server.stop();
    await db.destroy();
    testEsClient.close();
  });

  it('should search for Items under User entity', async () => {
    const SEARCH_QUERY = `
      query search(
        $id: ID!
        $term: String!
        $fields: [String]!
        $highlightFields: [SearchHighlightField]
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            search(
              params: {
                term: $term
                fields: $fields
                highlightFields: $highlightFields
              }
            ) {
              results {
                itemId
                highlights {
                  title
                  tags
                }
              }
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'super',
      fields: ['title', 'tags'],
      highlightFields: [
        { field: 'title', size: 8 },
        { field: 'tags', size: 10 },
      ],
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_QUERY,
      variables,
    });
    const expected = [
      {
        itemId: '12345',
        highlights: {
          title: ['A <em>super</em> fun'],
          tags: ['<em>super</em>'],
        },
      },
    ];
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].search.results).toIncludeSameMembers(
      expected
    );
  });
  it('should handle response that returns hits with no highlights object', async () => {
    const variables = {
      id: '1',
      pagination: { first: 1 },
      term: ' ',
      sort: {
        sortBy: `CREATED_AT`,
        sortOrder: `DESC`,
      },
      filter: {
        isFavorite: true,
        contentType: `ARTICLE`,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    const searchResult = res.body.data?._entities[0].searchSavedItems;
    expect(searchResult).not.toBeNull();
    expect(searchResult.edges.length).toEqual(1);
    expect(searchResult.edges[0].node.savedItem.id).not.toBeNull();
    expect(searchResult.edges[0].node.searchHighlights).toStrictEqual({
      fullText: null,
      tags: null,
      title: null,
    });
  });
  it('should handle response that returns no hits', async () => {
    const variables = {
      id: '1',
      pagination: { first: 1 },
      term: 'unangenehm',
      sort: {
        sortBy: `CREATED_AT`,
        sortOrder: `DESC`,
      },
      filter: {
        isFavorite: true,
        contentType: `ARTICLE`,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    const searchResult = res.body.data?._entities[0].searchSavedItems;
    expect(searchResult).not.toBeNull();
    expect(searchResult.edges.length).toEqual(0);
    expect(searchResult.totalCount).toEqual(0);
    expect(searchResult.pageInfo).toStrictEqual({
      endCursor: null,
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
    });
  });
  it('should search query term with pagination, filters and sort', async () => {
    const variables = {
      id: '1',
      term: 'super fun article',
      pagination: { after: `MA==`, first: 2 },
      sort: {
        sortBy: `CREATED_AT`,
        sortOrder: `DESC`,
      },
      filter: {
        isFavorite: true,
        contentType: `ARTICLE`,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItems;
    expect(response).not.toBeNull();
    expect(response.totalCount).toEqual(3);
    expect(response.edges.length).toEqual(2);
    expect(response.pageInfo.hasNextPage).toBeFalse();
    expect(response.pageInfo.hasPreviousPage).toBeTrue();
    expect(response.edges[0].node.savedItem.id).toEqual('456');
    expect(response.edges[1].node.savedItem.id).toEqual('12345');
    //fullText: not related to search
    expect(response.edges[0].node.searchHighlights['fullText']).toBeNull();
    expect(response.edges[0].node.searchHighlights['tags']).toStrictEqual([
      `<em>article</em>`,
    ]);
    expect(response.edges[0].node.searchHighlights['title']).toStrictEqual([
      `snowboarding <em>fun</em> <em>article</em>`,
    ]);
    expect(response.edges[1].node.searchHighlights['fullText']).toStrictEqual([
      `some text that can be used for <em>article</em> highlights`,
    ]);
  });

  it('should search with domain as filter', async () => {
    const variables = {
      id: '1',
      term: 'fun',
      pagination: { first: 2 },
      sort: {
        sortBy: `CREATED_AT`,
        sortOrder: `DESC`,
      },
      filter: {
        domain: 'winter.com',
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });

    const response = res.body.data?._entities[0].searchSavedItems;
    expect(response).not.toBeNull();
    expect(response.totalCount).toEqual(1);
    expect(response.edges.length).toEqual(1);
    expect(response.pageInfo.hasNextPage).toBeFalse();
    expect(response.pageInfo.hasPreviousPage).toBeFalse();
    expect(response.edges[0].node.savedItem.id).toEqual('789');
    expect(response.edges[0].node.searchHighlights['title']).toStrictEqual([
      `winter skating <em>fun</em> article`,
    ]);
  });

  it('should properly filter multi-word search tags', async () => {
    const variables = {
      id: '1',
      term: 'article #"cryptid fun"', // 'article' search has multiple matches, but only one 'cryptid fun' tag
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItems;
    expect(response).not.toBeNull();
    expect(response.totalCount).toEqual(1);
    expect(response.edges.length).toEqual(1);
    expect(response.edges[0].node.savedItem.id).toEqual('777');
  });

  it('should properly filter by tag combinations', async () => {
    const variables = {
      id: '1',
      term: '#fun tag:coffee', // multiple have #fun tag but only one #coffee
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItems;
    expect(response).not.toBeNull();
    expect(response.totalCount).toEqual(1);
    expect(response.edges.length).toEqual(1);
    expect(response.edges[0].node.savedItem.id).toEqual('123');
  });

  it('should use titleOnly search when requested', async () => {
    const variables = {
      id: '1',
      term: 'snowboard', // only 1 article has snowboarding in the title
      filter: {
        onlyTitleAndURL: true,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItems;
    expect(response).not.toBeNull();
    expect(response.totalCount).toEqual(1);
    expect(response.edges.length).toEqual(1);
    expect(response.edges[0].node.savedItem.id).toEqual('456');
    expect(response.edges[0].node.searchHighlights).toBeNull();
  });

  it('should not use titleOnly search when told not to', async () => {
    const variables = {
      id: '1',
      term: 'snowboard',
      filter: {
        onlyTitleAndURL: false,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItems;
    expect(response).not.toBeNull();
    expect(response.totalCount).toEqual(1);
    expect(response.edges.length).toEqual(1);
    expect(response.edges[0].node.savedItem.id).toEqual('456');
    expect(response.edges[0].node.searchHighlights['fullText']).toBeNull();
    expect(response.edges[0].node.searchHighlights['title']).toStrictEqual([
      `<em>snowboarding</em> fun article`,
    ]);
  });
  describe('searchQuery', () => {
    const SEARCH_QUERY = `
    query advancedSearch(
      $id: ID!
      $queryString: String
      $filter: AdvancedSearchFilters
      $sort: SearchSortInput
      $pagination: PaginationInput
    ) {
      _entities(representations: { id: $id, __typename: "User" }) {
        ... on User {
          advancedSearch(
            queryString: $queryString
            filter: $filter
            sort: $sort
            pagination: $pagination
          ) {
            edges {
              cursor
              node {
                savedItem {
                  id
                }
                searchHighlights {
                  tags
                  fullText
                  title
                }
              }
            }
            pageInfo {
              startCursor
            }
            totalCount
          }
        }
      }
    }
  `;

    it('should work for premium users (smoke test)', async () => {
      // Smoke test through the server; the search method is tested
      // deeply in advancedSearch.integration.ts'
      const variables = {
        id: '1',
        queryString: 'fun',
        pagination: { first: 2 },
        sort: {
          sortBy: `CREATED_AT`,
          sortOrder: `DESC`,
        },
        filter: {
          domain: 'winter.com',
        },
      };
      const res = await request(app).post(url).set(headers).send({
        query: SEARCH_QUERY,
        variables,
      });

      const response = res.body.data?._entities[0].advancedSearch;
      const expected = {
        totalCount: 1,
        edges: expect.toIncludeSameMembers([
          expect.objectContaining({
            cursor: expect.toBeString(),
            node: expect.objectContaining({
              savedItem: {
                id: '789',
              },
              searchHighlights: expect.objectContaining({
                title: expect.toIncludeSameMembers([
                  `winter skating <em>fun</em> article`,
                ]),
              }),
            }),
          }),
        ]),
        pageInfo: expect.objectContaining({
          startCursor: expect.toBeString(),
        }),
      };
      expect(response).toEqual(expected);
    });

    it.each([
      {
        name: 'before/last pagination',
        overrides: { pagination: { before: 'abc', last: 2 } },
        expectedMessage: 'Pagination by "before"/"last" are not supported',
      },
      {
        name: 'last pagination',
        overrides: { pagination: { last: 2 } },
        expectedMessage: 'Pagination by "before"/"last" are not supported',
      },
      {
        name: 'missing query string and no filters',
        overrides: { queryString: undefined, filter: undefined },
        expectedMessage:
          'Must provide either filters or query string to search',
      },
      {
        name: 'empty query string and no filters',
        overrides: { queryString: '', filter: undefined },
        expectedMessage:
          'Must provide either filters or query string to search',
      },
    ])(
      'should throw user input error if: $name',
      async ({ overrides, expectedMessage }) => {
        const basicVars = {
          id: '1',
          queryString: 'fun',
          pagination: { first: 2 },
          filter: {
            domain: 'winter.com',
          },
        };
        const res = await request(app)
          .post(url)
          .set(headers)
          .send({
            query: SEARCH_QUERY,
            variables: { ...basicVars, ...overrides },
          });

        const response = res.body.errors;
        const expected = expect.toIncludeSameMembers([
          expect.objectContaining({
            message: expect.toInclude(expectedMessage),
            extensions: {
              code: 'BAD_USER_INPUT',
            },
          }),
        ]);
        expect(response).toEqual(expected);
      }
    );
  });
});
