import { startServer } from './server/serverUtils.js';
import { ContextManager } from './server/context.js';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { knexDbReadClient } from './datasource/clients/knexClient.js';
import { Knex } from 'knex';
import { SavedItemStatus } from './types.js';
import {
  loadItemExtended,
  loadList,
  SeedData,
} from './searchIntegrationTestHelpers.js';

async function seedDb(db: Knex) {
  const data: SeedData[] = [
    {
      favorite: 1,
      itemId: 12345,
      status: SavedItemStatus.ARCHIVED,
      title: 'super fun article',
      url: 'http://test1.com',
      date: new Date('2020-10-03 10:20:30'),
      wordCount: 10,
    },
    {
      favorite: 1,
      itemId: 123,
      status: SavedItemStatus.UNREAD,
      title: 'another fun article',
      url: 'http://test2.com',
      date: new Date('2021-10-03 10:20:30'),
      wordCount: 50,
    },
    {
      favorite: 0,
      itemId: 456,
      status: SavedItemStatus.UNREAD,
      title: 'winter sports fun',
      url: 'http://test3.com',
      date: new Date('2021-5-03 10:20:30'),
      wordCount: 100,
      isVideo: 1,
    },
    {
      favorite: 1,
      itemId: 101010,
      status: SavedItemStatus.DELETED,
      title: 'deleted article',
      url: 'http://deleted.com',
      date: new Date('2020-10-03 10:20:30'),
      wordCount: 10,
    },
    {
      favorite: 0,
      itemId: 777,
      status: SavedItemStatus.UNREAD,
      title: 'sports ball',
      url: 'http://differentdomain.com',
      date: new Date('2021-5-03 10:20:30'),
      wordCount: 100,
      isVideo: 1,
    },
  ];
  await Promise.all(
    data.flatMap((record) => [
      loadItemExtended(db, record),
      loadList(db, record),
    ]),
  );
  // Test for a real case where title is not populated
  // on the case-insensitive list.title field, but populated
  // on the case-sensitive items_extended field
  const caseCase = {
    favorite: 0,
    itemId: 789,
    status: SavedItemStatus.UNREAD,
    title: 'I love WINTER',
    url: 'http://test4.com',
    date: new Date('2021-5-03 10:20:29'),
    wordCount: 100,
    isVideo: 0,
  };
  await loadItemExtended(db, caseCase);
  await loadList(db, { ...caseCase, title: '' });
}

describe('free-tier search (offset pagination)', () => {
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const db = knexDbReadClient();
  const headers = {
    userid: '1',
    premium: 'false',
  };
  const updateDate = new Date(2021, 10, 1, 0, 0); // mock date for insert

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));

    await db('readitla_ril-tmp.list').truncate();
    await db('readitla_b.items_extended').truncate();
    await seedDb(db);
  });

  beforeEach(async () => {
    jest.useFakeTimers({
      now: updateDate,
      doNotFake: [
        'nextTick',
        'setImmediate',
        'clearImmediate',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
      ],
      advanceTimers: false,
    });
  });

  afterAll(async () => {
    await server.stop();
    await db('readitla_ril-tmp.list').truncate();
    await db('readitla_b.items_extended').truncate();
    await db.destroy();
    jest.useRealTimers();
  });

  const searchResultFragment = `
  fragment SearchPageFields on SavedItemSearchResultPage {
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
    offset
    limit
    totalCount
  }`;
  it('should be case-insensitive', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
      ${searchResultFragment}
      query searchSavedItem(
        $id: ID!
        $term: String!
        $pagination: OffsetPaginationInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItemsByOffset(term: $term, pagination: $pagination) {
                ...SearchPageFields
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'wiNter',
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItemsByOffset;
    const expected = {
      entries: [
        expect.objectContaining({
          savedItem: { id: '456' },
        }),
        expect.objectContaining({
          savedItem: { id: '789' },
        }),
      ],
      totalCount: 2,
      limit: 30,
      offset: 0,
    };
    expect(response).toEqual(expected);
  });

  it('should search paginated search with limit and offset', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
      ${searchResultFragment}
      query searchSavedItem(
        $id: ID!
        $term: String!
        $pagination: OffsetPaginationInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItemsByOffset(term: $term, pagination: $pagination) {
                ...SearchPageFields
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'fun',
      pagination: {
        limit: 4,
        offset: 2,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItemsByOffset;
    const expected = {
      entries: [
        expect.objectContaining({
          savedItem: { id: '12345' },
        }),
      ],
      totalCount: 3,
      limit: 4,
      offset: 2,
    };
    expect(response).toEqual(expected);
  });

  it('should not return deleted articles', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
      ${searchResultFragment}
      query searchSavedItem(
        $id: ID!
        $term: String!
        $pagination: OffsetPaginationInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItemsByOffset(term: $term, pagination: $pagination) {
              ...SearchPageFields
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'article',
      pagination: {
        limit: 30,
      },
    };

    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItemsByOffset;
    expect(response.totalCount).toBe(2);
    const ids = response.entries.map((entry) => entry.savedItem.id);
    expect(ids).not.toContain('101010');
  });

  it('should search items based on url', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
      ${searchResultFragment}
      query searchSavedItem(
        $id: ID!
        $term: String!
        $pagination: OffsetPaginationInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItemsByOffset(term: $term, pagination: $pagination) {
              ...SearchPageFields
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'test2.com',
      pagination: {
        limit: 2,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItemsByOffset;
    const expected = {
      entries: [expect.objectContaining({ savedItem: { id: '123' } })],
      totalCount: 1,
      limit: 2,
      offset: 0,
    };
    expect(response).toEqual(expected);
  });

  it('should return empty search result when term not found', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
      ${searchResultFragment}
      query searchSavedItem(
        $id: ID!
        $term: String!
        $pagination: OffsetPaginationInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItemsByOffset(term: $term, pagination: $pagination) {
              ...SearchPageFields
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'apple',
      pagination: {
        limit: 4,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItemsByOffset;
    const expected = {
      entries: [],
      totalCount: 0,
      limit: 4,
      offset: 0,
    };
    expect(response).toEqual(expected);
  });
  it('should filter to a specific domain', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
    ${searchResultFragment}
      query searchSavedItem(
        $id: ID!
        $term: String!
        $filter: SearchFilterInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItemsByOffset(term: $term, filter: $filter) {
              ...SearchPageFields
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'sports',
      filter: {
        domain: 'www.differentdomain.com',
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItemsByOffset;
    const expected = {
      entries: [expect.objectContaining({ savedItem: { id: '777' } })],
      totalCount: 1,
      limit: 30,
      offset: 0,
    };
    expect(response).toEqual(expected);
  });
  it('should search only unread videos', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
    ${searchResultFragment}
      query searchSavedItem(
        $id: ID!
        $term: String!
        $pagination: OffsetPaginationInput
        $filter: SearchFilterInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItemsByOffset(term: $term, pagination: $pagination, filter: $filter) {
              ...SearchPageFields
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'fun',
      pagination: {
        limit: 2,
      },
      filter: {
        contentType: `VIDEO`,
        status: `UNREAD`,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItemsByOffset;
    const expected = {
      entries: [expect.objectContaining({ savedItem: { id: '456' } })],
      totalCount: 1,
      limit: 2,
      offset: 0,
    };
    expect(response).toEqual(expected);
  });
  it('should sort search result by time to read and asc', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
      ${searchResultFragment}
      query searchSavedItem(
        $id: ID!
        $term: String!
        $sort: SearchSortInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItemsByOffset(term: $term, sort: $sort) {
              ...SearchPageFields
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'fun',
      sort: {
        sortBy: `TIME_TO_READ`,
        sortOrder: `ASC`,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItemsByOffset;
    const expected = expect.objectContaining({
      entries: [
        expect.objectContaining({ savedItem: { id: '12345' } }),
        expect.objectContaining({ savedItem: { id: '123' } }),
        expect.objectContaining({ savedItem: { id: '456' } }),
      ],
      totalCount: 3,
    });
    expect(response).toEqual(expected);
  });
  it('should sort search result by time created and asc', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
      ${searchResultFragment}
      query searchSavedItem(
        $id: ID!
        $term: String!
        $sort:SearchSortInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItemsByOffset(term: $term, sort: $sort) {
              ...SearchPageFields
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'fun',
      sort: {
        sortBy: `CREATED_AT`,
        sortOrder: `ASC`,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItemsByOffset;
    const expected = expect.objectContaining({
      entries: [
        expect.objectContaining({ savedItem: { id: '12345' } }),
        expect.objectContaining({ savedItem: { id: '456' } }),
        expect.objectContaining({ savedItem: { id: '123' } }),
      ],
      totalCount: 3,
    });
    expect(response).toEqual(expected);
  });
  it('advancedSearch should return free search for non premium', async () => {
    // Copy of another test, with the advancedSearch base query
    const ADVANCED_SEARCH_QUERY = `
    ${searchResultFragment}
    query advancedSearch(
      $id: ID!
      $queryString: String
      $pagination: OffsetPaginationInput
    ) {
      _entities(representations: { id: $id, __typename: "User" }) {
        ... on User {
          advancedSearchByOffset(queryString: $queryString, pagination: $pagination) {
              ...SearchPageFields
          }
        }
      }
    }
  `;
    const variables = {
      id: '1',
      queryString: 'fun',
      pagination: {
        limit: 4,
        offset: 2,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: ADVANCED_SEARCH_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].advancedSearchByOffset;
    const expected = {
      entries: [
        expect.objectContaining({
          savedItem: { id: '12345' },
        }),
      ],
      totalCount: 3,
      limit: 4,
      offset: 2,
    };
    expect(response).toEqual(expected);
  });
});
