import { startServer } from './server/serverUtils';
import { ContextManager } from './server/context';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { knexDbClient } from './datasource/clients/knexClient';
import { Knex } from 'knex';
import { SavedItemStatus } from './types';
import { loadItemExtended, loadList } from './searchIntegrationTestHelpers';

async function seedDb(db: Knex) {
  const data = [
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
  ];
  await Promise.all(
    data.flatMap((record) => [
      loadItemExtended(db, record),
      loadList(db, record),
    ]),
  );
}

describe('free search test', () => {
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const db = knexDbClient();
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
    jest.useFakeTimers({ now: updateDate, advanceTimers: true });
  });

  afterAll(async () => {
    await server.stop();
    await db('readitla_ril-tmp.list').truncate();
    await db('readitla_b.items_extended').truncate();
    await db.destroy();
    jest.useRealTimers();
  });

  const query = ` edges
    {
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
    totalCount`;

  it('should search paginated search with after and first', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
      query searchSavedItem(
        $id: ID!
        $term: String!
        $pagination: PaginationInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItems(term: $term, pagination: $pagination) {
                ${query}
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'fun',
      pagination: {
        first: 4,
        //cursor of latest item, i.e test2.com
        after: `NDU2XypfIjIwMjEtMDUtMDNUMTc6MjA6MzAuMDAwWiI=`,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItems;
    expect(response).not.toBeNull();
    expect(response.totalCount).toBe(3);
    expect(response.pageInfo.hasNextPage).toBeFalse();
    expect(response.pageInfo.hasPreviousPage).toBeTrue();
    expect(response.edges[0].node.savedItem.id).toBe('456');
    expect(response.edges[1].node.savedItem.id).toBe('12345');
  });

  it('should not return deleted articles', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
      query searchSavedItem(
        $id: ID!
        $term: String!
        $pagination: PaginationInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItems(term: $term, pagination: $pagination) {
              ${query}
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'article',
      pagination: {
        first: 4,
      },
    };

    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItems;
    expect(response).not.toBeNull();
    expect(response.totalCount).toBe(2);
    const ids = response.edges.map((edge) => edge.node.savedItem.id);
    ids.forEach((id) => {
      expect(id).not.toBe('101010');
    });
  });

  it('should search items based on url', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
      query searchSavedItem(
        $id: ID!
        $term: String!
        $pagination: PaginationInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItems(term: $term, pagination: $pagination) {
              ${query}
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'test2.com',
      pagination: {
        first: 2,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItems;
    expect(response).not.toBeNull();
    expect(response.totalCount).toBe(1);
    expect(response.pageInfo.hasNextPage).toBeFalse();
    expect(response.pageInfo.hasPreviousPage).toBeFalse();
    expect(response.edges[0].node.savedItem.id).toBe('123');
  });

  it('should return empty search result when term not found', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
      query searchSavedItem(
        $id: ID!
        $term: String!
        $pagination: PaginationInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItems(term: $term, pagination: $pagination) {
              ${query}
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'apple',
      pagination: {
        first: 4,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItems;
    expect(response).not.toBeNull();
    expect(response.totalCount).toBe(0);
    expect(response.pageInfo.hasNextPage).toBeFalse();
    expect(response.pageInfo.hasPreviousPage).toBeFalse();
    expect(response.edges.length).toBe(0);
  });

  it('should search paginated search with before and last', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
      query searchSavedItem(
        $id: ID!
        $term: String!
        $pagination: PaginationInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItems(term: $term, pagination: $pagination) {
              ${query}
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'fun',
      pagination: {
        last: 2,
        //cursor of test1.com
        before: `MTIzNDVfKl8iMjAyMC0xMC0wM1QxNzoyMDozMC4wMDBaIg==`,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SEARCH_SAVED_ITEM_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].searchSavedItems;
    expect(response).not.toBeNull();
    expect(response.totalCount).toBe(3);
    expect(response.pageInfo.hasNextPage).toBeTrue();
    expect(response.pageInfo.hasPreviousPage).toBeFalse();
    expect(response.edges[0].node.savedItem.id).toBe('123');
    expect(response.edges[1].node.savedItem.id).toBe('456');
  });
  it('should search favorited item only with content type as article', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
      query searchSavedItem(
        $id: ID!
        $term: String!
        $pagination: PaginationInput
        $filter: SearchFilterInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItems(term: $term, pagination: $pagination, filter: $filter) {
              ${query}
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'fun',
      pagination: {
        first: 2,
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
    expect(response.totalCount).toBe(2);
    expect(response.pageInfo.hasNextPage).toBeFalse();
    expect(response.pageInfo.hasPreviousPage).toBeFalse();
    expect(response.edges[0].node.savedItem.id).toBe('123');
    expect(response.edges[1].node.savedItem.id).toBe('12345');
  });

  it('should search only unread videos', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
      query searchSavedItem(
        $id: ID!
        $term: String!
        $pagination: PaginationInput
        $filter: SearchFilterInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItems(term: $term, pagination: $pagination, filter: $filter) {
              ${query}
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      term: 'fun',
      pagination: {
        first: 2,
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
    const response = res.body.data?._entities[0].searchSavedItems;
    expect(response).not.toBeNull();
    expect(response.totalCount).toBe(1);
    expect(response.pageInfo.hasNextPage).toBeFalse();
    expect(response.pageInfo.hasPreviousPage).toBeFalse();
    expect(response.edges[0].node.savedItem.id).toBe('456');
  });
  it('should sort search result by time to read and asc', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
      query searchSavedItem(
        $id: ID!
        $term: String!
        $sort:SearchSortInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItems(term: $term, sort: $sort) {
              ${query}
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
    const response = res.body.data?._entities[0].searchSavedItems;
    expect(response).not.toBeNull();
    expect(response.totalCount).toBe(3);
    expect(response.pageInfo.hasNextPage).toBeFalse();
    expect(response.pageInfo.hasPreviousPage).toBeFalse();
    expect(response.edges[0].node.savedItem.id).toBe('12345');
    expect(response.edges[1].node.savedItem.id).toBe('123');
    expect(response.edges[2].node.savedItem.id).toBe('456');
  });
  it('should sort search result by time created and asc', async () => {
    const SEARCH_SAVED_ITEM_QUERY = `
      query searchSavedItem(
        $id: ID!
        $term: String!
        $sort:SearchSortInput
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            searchSavedItems(term: $term, sort: $sort) {
              ${query}
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
    const response = res.body.data?._entities[0].searchSavedItems;
    expect(response).not.toBeNull();
    expect(response.totalCount).toBe(3);
    expect(response.pageInfo.hasNextPage).toBeFalse();
    expect(response.pageInfo.hasPreviousPage).toBeFalse();
    expect(response.edges[0].node.savedItem.id).toBe('12345');
    expect(response.edges[1].node.savedItem.id).toBe('456');
    expect(response.edges[2].node.savedItem.id).toBe('123');
  });
  it('advancedSearch should return free search for non premium', async () => {
    // Copy of another test, with the advancedSearch base query
    const ADVANCED_SEARCH_QUERY = `
    query advancedSearch(
      $id: ID!
      $queryString: String
      $pagination: PaginationInput
    ) {
      _entities(representations: { id: $id, __typename: "User" }) {
        ... on User {
          advancedSearch(queryString: $queryString, pagination: $pagination) {
              ${query}
          }
        }
      }
    }
  `;
    const variables = {
      id: '1',
      queryString: 'fun',
      pagination: {
        first: 4,
        //cursor of latest item, i.e test2.com
        after: `NDU2XypfIjIwMjEtMDUtMDNUMTc6MjA6MzAuMDAwWiI=`,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: ADVANCED_SEARCH_QUERY,
      variables,
    });
    const response = res.body.data?._entities[0].advancedSearch;
    expect(response).not.toBeNull();
    expect(response.totalCount).toBe(3);
    expect(response.pageInfo.hasNextPage).toBeFalse();
    expect(response.pageInfo.hasPreviousPage).toBeTrue();
    expect(response.edges[0].node.savedItem.id).toBe('456');
    expect(response.edges[1].node.savedItem.id).toBe('12345');
  });
});
