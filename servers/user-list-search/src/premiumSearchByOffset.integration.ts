import { config } from './config';
import { bulkDocument } from './datasource/elasticsearch/elasticsearchBulk';
import { client } from './datasource/elasticsearch';
import { startServer } from './server/serverUtils';
import { ContextManager } from './server/context';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { knexDbReadClient } from './datasource/clients/knexClient';
import { Knex } from 'knex';
import { loadItemExtended, loadList } from './searchIntegrationTestHelpers';
import { SavedItemStatus } from './types';

// These tests are lifted from premiumSearch.integration.ts

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
  db: Knex,
) {
  const merged = {
    ...defaultDocProps,
    ...item,
  };
  const seed = {
    favorite: merged.favorite ? 1 : 0,
    itemId: merged.item_id,
    // The use case here only needs to support queued and archived, so not getting fancy.
    status:
      merged.status == 'queued'
        ? SavedItemStatus.UNREAD
        : SavedItemStatus.ARCHIVED,
    title: merged.title,
    url: merged.url,
    date: new Date(merged.date_added),
    wordCount: merged.word_count,
  };

  await loadList(db, seed);
  await loadItemExtended(db, seed);
  return await bulkDocument([
    {
      action: 'index',
      ...merged,
    },
  ]);
}

describe('premium search functional test (offset pagination)', () => {
  const testEsClient = client;
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const db = knexDbReadClient();
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
      $pagination: OffsetPaginationInput
    ) {
      _entities(representations: { id: $id, __typename: "User" }) {
        ... on User {
          searchSavedItemsByOffset(
            term: $term
            filter: $filter
            sort: $sort
            pagination: $pagination
          ) {
            entries {
              savedItem {
                id
              }
              searchHighlights {
                tags
                fullText
                title
              }
            }
            limit
            offset
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

    // Wait for delete to finish
    await testEsClient.indices.refresh({
      index: config.aws.elasticsearch.index,
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
        db,
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
        db,
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
        db,
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
        db,
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
        db,
      ),
    ];
    await Promise.all(items);
    // Takes a hot sec for the data to be available, otherwise test flakes
    await testEsClient.indices.refresh({
      index: config.aws.elasticsearch.index,
    });
  });

  afterAll(async () => {
    await server.stop();
    await db.destroy();
    testEsClient.close();
  });

  it('should handle response that returns hits with no highlights object', async () => {
    const variables = {
      id: '1',
      pagination: { limit: 1 },
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
    const searchResult = res.body.data?._entities[0].searchSavedItemsByOffset;
    const expected = expect.objectContaining({
      entries: [
        {
          savedItem: { id: expect.toBeString() },
          searchHighlights: { fullText: null, tags: null, title: null },
        },
      ],
    });
    expect(searchResult).toEqual(expected);
  });
  it('should handle response that returns no hits', async () => {
    const variables = {
      id: '1',
      pagination: { limit: 1 },
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
    const searchResult = res.body.data?._entities[0].searchSavedItemsByOffset;
    const expected = {
      entries: [],
      limit: 1,
      offset: 0,
      totalCount: 0,
    };
    expect(searchResult).toEqual(expected);
  });
  it('should search query term with pagination, filters and sort', async () => {
    const variables = {
      id: '1',
      term: 'super fun article',
      pagination: { offset: 1, limit: 2 },
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
    const response = res.body.data?._entities[0].searchSavedItemsByOffset;
    const expected = {
      entries: [
        {
          savedItem: { id: '456' },
          searchHighlights: {
            fullText: null,
            tags: [`<em>article</em>`],
            title: [`snowboarding <em>fun</em> <em>article</em>`],
          },
        },
        {
          savedItem: { id: '12345' },
          searchHighlights: expect.objectContaining({
            fullText: [
              `some text that can be used for <em>article</em> highlights`,
            ],
          }),
        },
      ],
      limit: 2,
      offset: 1,
      totalCount: 3,
    };
    expect(response).toEqual(expected);
  });

  it('should search with domain as filter', async () => {
    const variables = {
      id: '1',
      term: 'fun',
      pagination: { limit: 2 },
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

    const response = res.body.data?._entities[0].searchSavedItemsByOffset;
    const expected = {
      entries: [
        {
          savedItem: { id: '789' },
          searchHighlights: expect.objectContaining({
            title: [`winter skating <em>fun</em> article`],
          }),
        },
      ],
      totalCount: 1,
      limit: 2,
      offset: 0,
    };
    expect(response).toEqual(expected);
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
    const response = res.body.data?._entities[0].searchSavedItemsByOffset;
    const expected = expect.objectContaining({
      entries: [expect.objectContaining({ savedItem: { id: '777' } })],
      totalCount: 1,
    });
    expect(response).toEqual(expected);
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
    const response = res.body.data?._entities[0].searchSavedItemsByOffset;
    const expected = expect.objectContaining({
      entries: [expect.objectContaining({ savedItem: { id: '123' } })],
      totalCount: 1,
    });
    expect(response).toEqual(expected);
  });

  describe('searchQuery', () => {
    const SEARCH_QUERY = `
    query advancedSearchByOffset(
      $id: ID!
      $queryString: String
      $filter: AdvancedSearchFilters
      $sort: SearchSortInput
      $pagination: OffsetPaginationInput
    ) {
      _entities(representations: { id: $id, __typename: "User" }) {
        ... on User {
          advancedSearchByOffset(
            queryString: $queryString
            filter: $filter
            sort: $sort
            pagination: $pagination
          ) {
            entries {
              savedItem {
                id
              }
              searchHighlights {
                tags
                title
                fullText
              }
            }
            limit
            offset
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
        pagination: { limit: 2 },
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

      const response = res.body.data?._entities[0].advancedSearchByOffset;
      const expected = {
        limit: 2,
        offset: 0,
        totalCount: 1,
        entries: [
          expect.objectContaining({
            savedItem: {
              id: '789',
            },
            searchHighlights: expect.objectContaining({
              title: [`winter skating <em>fun</em> article`],
            }),
          }),
        ],
      };
      expect(response).toEqual(expected);
    });

    it.skip.each([
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
      'should throw user input error if',
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
            extensions: expect.objectContaining({
              code: 'BAD_USER_INPUT',
            }),
          }),
        ]);
        expect(response).toEqual(expected);
      },
    );
  });
});
