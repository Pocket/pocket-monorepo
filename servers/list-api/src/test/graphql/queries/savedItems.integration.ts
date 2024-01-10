import { readClient, writeClient } from '../../../database/client';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';

describe('getSavedItems', () => {
  const writeDb = writeClient();
  const readDb = readClient();
  const headers = { userid: '1' };

  // TODO: What date is the server running in? Web repo does central...
  // should this do UTC, this changes pagination cursors.
  const date1 = new Date('2020-10-03 10:20:30'); // Consistent date for seeding
  const date2 = new Date('2020-10-03 10:22:30'); // Consistent date for seeding
  const date3 = new Date('2020-10-03 10:25:30'); // Consistent date for seeding
  const nullDate = new Date('0000-00-00 00:00:00');
  let app: Express;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const GET_SAVED_ITEMS = `
    query getSavedItem(
      $id: ID!
      $pagination: PaginationInput
      $sort: SavedItemsSort
    ) {
      _entities(representations: { id: $id, __typename: "User" }) {
        ... on User {
          savedItems(pagination: $pagination, sort: $sort) {
            edges {
              cursor
              node {
                url
                item {
                  ... on Item {
                    givenUrl
                  }
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

  beforeAll(async () => ({ app, server, url } = await startServer(0)));

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    await server.stop();
  });

  beforeEach(async () => {
    await writeDb('list').truncate();
    await writeDb('list').insert([
      {
        user_id: 1,
        item_id: 1,
        resolved_id: 1,
        given_url: 'http://abc',
        title: 'mytitle',
        time_added: date1,
        time_updated: date2,
        time_read: date1,
        time_favorited: nullDate,
        api_id: 'apiid',
        status: 1,
        favorite: 0,
        api_id_updated: 'apiid',
      },
      {
        user_id: 1,
        item_id: 2,
        resolved_id: 2,
        given_url: 'http://def',
        title: 'title2',
        time_added: date2,
        time_updated: date3,
        time_read: date2,
        time_favorited: date2,
        api_id: 'apiid',
        status: 0,
        favorite: 1,
        api_id_updated: 'apiid',
      },
      {
        user_id: 1,
        item_id: 3,
        resolved_id: 1,
        given_url: 'http://ijk',
        title: 'mytitle',
        time_added: date3,
        time_updated: date1,
        time_read: date3,
        time_favorited: date1,
        api_id: 'apiid',
        status: 0,
        favorite: 1,
        api_id_updated: 'apiid',
      },
    ]);
  });

  it('should resolve status field', async () => {
    const SAVED_ITEMS_FIELD = `
      query getSavedItem(
        $id: ID!
        $pagination: PaginationInput
        $sort: SavedItemsSort
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            savedItems(pagination: $pagination, sort: $sort) {
              edges {
                node {
                  status
                }
              }
            }
          }
        }
      }
    `;
    const variables = {
      id: '1',
      pagination: { first: 1 },
    };
    const res = await request(app).post(url).set(headers).send({
      query: SAVED_ITEMS_FIELD,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges[0].node.status).toBe(
      'UNREAD',
    );
  });

  it('should return a paginated list of most recently added items, with more next pages and all expected properties', async () => {
    const variables = {
      id: '1',
      pagination: { first: 2 },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.data?._entities[0].savedItems.totalCount).toBe(3);
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(2);
    expect(res.body.data?._entities[0].savedItems.edges[0].node.url).toBe(
      'http://ijk',
    );
    expect(
      res.body.data?._entities[0].savedItems.edges[0].node.item.givenUrl,
    ).toBe('http://ijk');
    expect(res.body.data?._entities[0].savedItems.edges[1].node.url).toBe(
      'http://def',
    );
    expect(
      res.body.data?._entities[0].savedItems.edges[1].node.item.givenUrl,
    ).toBe('http://def');
    expect(res.body.data?._entities[0].savedItems.pageInfo.hasNextPage).toBe(
      true,
    );
    expect(
      res.body.data?._entities[0].savedItems.pageInfo.hasPreviousPage,
    ).toBe(false);
  });
  it('should finish the forward pagination from previous cursor, without overfetching', async () => {
    const variables = {
      id: '1',
      pagination: {
        after: 'Ml8qXzE2MDE3Mzg1NTA=',
        first: 2,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(1);
    expect(res.body.data?._entities[0].savedItems.edges[0].node.url).toBe(
      'http://abc',
    );
    expect(
      res.body.data?._entities[0].savedItems.edges[0].node.item.givenUrl,
    ).toBe('http://abc');
    expect(res.body.data?._entities[0].savedItems.pageInfo.hasNextPage).toBe(
      false,
    );
    expect(
      res.body.data?._entities[0].savedItems.pageInfo.hasPreviousPage,
    ).toBe(true);
    expect(
      res.body.data?._entities[0].savedItems.pageInfo.startCursor,
    ).toBeDefined();
    expect(
      res.body.data?._entities[0].savedItems.pageInfo.endCursor,
    ).toBeDefined();
  });

  it('should paginate backwards, returning the least recently added items', async () => {
    // Note the order is still sorted on time_added desc (default), so it's more like
    // a slice is taken from the bottom of the stack rather than the top
    const variables = {
      id: '1',
      pagination: {
        last: 2,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(2);
    expect(res.body.data?._entities[0].savedItems.pageInfo.hasNextPage).toBe(
      false,
    );
    expect(
      res.body.data?._entities[0].savedItems.pageInfo.hasPreviousPage,
    ).toBe(true);
    expect(res.body.data?._entities[0].savedItems.edges[0].node.url).toBe(
      'http://def',
    );
    expect(res.body.data?._entities[0].savedItems.edges[1].node.url).toBe(
      'http://abc',
    );
  });

  it('should finish the backward pagination from the previous cursor, without overfetching', async () => {
    // The top of the stack is the last page when paginating in reverse
    const variables = {
      id: '1',
      pagination: {
        before: 'Ml8qXzE2MDE3Mzg1NTA=',
        last: 2,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(1);
    expect(
      res.body.data?._entities[0].savedItems.edges[0].node.item.givenUrl,
    ).toBe('http://ijk');
    expect(
      res.body.data?._entities[0].savedItems.pageInfo.hasPreviousPage,
    ).toBe(false);
    expect(res.body.data?._entities[0].savedItems.pageInfo.hasNextPage).toBe(
      true,
    );
  });

  it('can resolve a entity query for a SavedItem by Id', async () => {
    const RESOLVE_REFERENCE_QUERY = `
      query ($_representations: [_Any!]!) {
        _entities(representations: $_representations) {
          ... on SavedItem {
            id
          }
        }
      }
    `;

    const variables = {
      _representations: [
        {
          __typename: 'SavedItem',
          id: '1',
        },
        {
          __typename: 'SavedItem',
          id: '2',
        },
      ],
    };

    const res = await request(app).post(url).set(headers).send({
      query: RESOLVE_REFERENCE_QUERY,
      variables,
    });

    expect(res.body.data._entities[0].id).toBe('1');
    expect(res.body.data._entities[1].id).toBe('2');
  });

  it(`call succeeds with returning null value when Id is not found`, async () => {
    const RESOLVE_REFERENCE_QUERY = `
      query ($_representations: [_Any!]!) {
        _entities(representations: $_representations) {
          ... on SavedItem {
            id
          }
        }
      }
    `;

    const variables = {
      _representations: [
        {
          __typename: 'SavedItem',
          id: '100',
        },
        {
          __typename: 'SavedItem',
          id: '1',
        },
      ],
    };

    const res = await request(app).post(url).set(headers).send({
      query: RESOLVE_REFERENCE_QUERY,
      variables,
    });

    expect(res.body.data._entities[0]).toBeNull();
    expect(res.body.data._entities[1].id).toBe('1');
    expect(res.body.data._entities.length).toBe(2);
  });

  it('call succeeds with returning null value when Url is not found', async () => {
    const RESOLVE_REFERENCE_QUERY = `
      query ($_representations: [_Any!]!) {
        _entities(representations: $_representations) {
          ... on SavedItem {
            url
          }
        }
      }
    `;

    const variables = {
      _representations: [
        {
          __typename: 'SavedItem',
          url: 'http://not-found',
        },
        {
          __typename: 'SavedItem',
          url: 'http://abc',
        },
      ],
    };

    const res = await request(app).post(url).set(headers).send({
      query: RESOLVE_REFERENCE_QUERY,
      variables,
    });

    expect(res.body.data._entities[0]).toBeNull();
    expect(res.body.data._entities[1].url).toBe('http://abc');
    expect(res.body.data._entities.length).toBe(2);
  });

  it('can resolve a entity query for a SavedItem by Url', async () => {
    const RESOLVE_REFERENCE_QUERY = `
      query ($_representations: [_Any!]!) {
        _entities(representations: $_representations) {
          ... on SavedItem {
            url
          }
        }
      }
    `;

    const variables = {
      _representations: [
        {
          __typename: 'SavedItem',
          url: 'http://abc',
        },
        {
          __typename: 'SavedItem',
          url: 'http://def',
        },
      ],
    };

    const res = await request(app).post(url).set(headers).send({
      query: RESOLVE_REFERENCE_QUERY,
      variables,
    });

    expect(res.body.data._entities[0].url).toBe('http://abc');
    expect(res.body.data._entities[1].url).toBe('http://def');
  });

  describe('sort', () => {
    const GET_SAVED_ITEMS_SORT = `
      query getSavedItem(
        $id: ID!
        $pagination: PaginationInput
        $sort: SavedItemsSort
      ) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            savedItems(pagination: $pagination, sort: $sort) {
              edges {
                cursor
                node {
                  url
                  item {
                    ... on Item {
                      givenUrl
                    }
                  }
                }
              }
              pageInfo {
                startCursor
                endCursor
              }
            }
          }
        }
      }
    `;

    it('"first, descending" should equal "last, ascending" in reverse order', async () => {
      const variables = {
        id: '1',
        pagination: { first: 2 },
        sort: { sortBy: 'CREATED_AT', sortOrder: 'DESC' },
      };
      const compareVars = {
        id: '1',
        pagination: { last: 2 },
        sort: { sortBy: 'CREATED_AT', sortOrder: 'ASC' },
      };
      const res = await request(app).post(url).set(headers).send({
        query: GET_SAVED_ITEMS_SORT,
        variables,
      });
      const compareRes = await request(app).post(url).set(headers).send({
        query: GET_SAVED_ITEMS_SORT,
        variables: compareVars,
      });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data?._entities[0].savedItems.edges.length).toBe(2);
      expect(res.body.data?._entities[0].savedItems.edges.length).toBe(
        compareRes.body.data?._entities[0].savedItems.edges.length,
      );
      expect(res.body.data?._entities[0].savedItems.edges[0]).toEqual(
        compareRes.body.data?._entities[0].savedItems.edges[1],
      );
      expect(res.body.data?._entities[0].savedItems.edges[1]).toEqual(
        compareRes.body.data?._entities[0].savedItems.edges[0],
      );
      expect(res.body.data._entities[0].savedItems.pageInfo.startCursor).toBe(
        compareRes.body.data._entities[0].savedItems.pageInfo.endCursor,
      );
      expect(res.body.data._entities[0].savedItems.pageInfo.endCursor).toBe(
        compareRes.body.data._entities[0].savedItems.pageInfo.startCursor,
      );
    });
    test.each([
      {
        sortBy: 'CREATED_AT',
        sortOrder: 'DESC',
        expectedUrls: ['http://ijk', 'http://def'],
      },
      {
        sortBy: 'CREATED_AT',
        sortOrder: 'ASC',
        expectedUrls: ['http://abc', 'http://def'],
      },
      {
        sortBy: 'UPDATED_AT',
        sortOrder: 'DESC',
        expectedUrls: ['http://def', 'http://abc'],
      },
      {
        sortBy: 'UPDATED_AT',
        sortOrder: 'ASC',
        expectedUrls: ['http://ijk', 'http://abc'],
      },
      {
        sortBy: 'FAVORITED_AT',
        sortOrder: 'DESC',
        expectedUrls: ['http://def', 'http://ijk'],
      },
      {
        sortBy: 'FAVORITED_AT',
        // Note that this will put non-favorite items first (since they are set to time 0)
        sortOrder: 'ASC',
        expectedUrls: ['http://abc', 'http://ijk'],
      },
      {
        sortBy: 'ARCHIVED_AT',
        sortOrder: 'DESC',
        expectedUrls: ['http://ijk', 'http://def'],
      },
      {
        sortBy: 'ARCHIVED_AT',
        sortOrder: 'ASC',
        expectedUrls: ['http://abc', 'http://def'],
      },
    ])(
      ' by $sortBy, $sortOrder works',
      async ({ sortBy, sortOrder, expectedUrls }) => {
        const variables = {
          id: '1',
          pagination: { first: 2 },
          sort: { sortBy: sortBy, sortOrder: sortOrder },
        };
        const res = await request(app).post(url).set(headers).send({
          query: GET_SAVED_ITEMS_SORT,
          variables,
        });
        expect(res.body.errors).toBeUndefined();
        const urls = res.body.data?._entities[0].savedItems.edges.map(
          (edge) => edge.node.item.givenUrl,
        );
        expect(expectedUrls).toEqual(urls);
      },
    );
  });
  it('should throw error if cursor is not found', async () => {
    const variables = {
      id: '1',
      pagination: {
        before: 'abc123=',
        last: 2,
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors?.length).toBeGreaterThan(0);
    expect(res.body.errors[0].message).toBe('Cursor not found.');
  });
});
