import { readClient, writeClient } from '../../../database/client';
import { seeds } from '@pocket-tools/backend-benchmarking';
import { ListPaginationService } from '../../../dataService/listPaginationService';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { SavedItemStatus } from '../../../types';

// Note -- additional pagination-related tests are included in savedItems* test files
describe('getSavedItems pagination', () => {
  const writeDb = writeClient();
  const readDb = readClient();
  const headers = { userid: '1' };

  const baseVariables = {
    id: '1',
  };
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const PAGINATE = `
    query getSavedItem(
      $id: ID!
      $filter: SavedItemsFilter
      $pagination: PaginationInput
      $sort: SavedItemsSort
    ) {
      _entities(representations: { id: $id, __typename: "User" }) {
        ... on User {
          savedItems(filter: $filter, sort: $sort, pagination: $pagination) {
            totalCount
            pageInfo {
              startCursor
              endCursor
              hasNextPage
              hasPreviousPage
            }
            edges {
              cursor
              node {
                id
              }
            }
          }
        }
      }
    }
  `;

  const GET_ARCHIVED_ITEMS = `
  query getSavedItem(
    $id: ID!
    $filter: SavedItemsFilter
    $pagination: PaginationInput
    $sort: SavedItemsSort
  ) {
    _entities(representations: { id: $id, __typename: "User" }) {
      ... on User {
        savedItems(filter: $filter, sort: $sort, pagination: $pagination) {
          totalCount
          pageInfo {
            startCursor
            endCursor
            hasNextPage
            hasPreviousPage
          }
          edges {
            cursor
            node {
              id
              url
              title
              item {
                __typename
                ... on Item {
                  givenUrl
                }
                ... on PendingItem {
                  url
                }
              }
            }
          }
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

  describe('cursor generation without nulls', () => {
    let rowsById;
    const seeder = seeds.mockList('1', {
      count: 20,
      batchSize: 21,
      archiveRate: 1.0,
      favoriteRate: 1.0,
    });
    const batch = seeder.next(); // This gets the whole batch

    beforeAll(async () => {
      await writeDb('list').truncate();
      await Promise.all([writeDb('list').insert(batch.value['list'])]);
      const actualRows = await readDb('list').where({ user_id: 1 }).select();
      rowsById = actualRows.reduce((acc, row) => {
        acc[row.item_id] = row;
        return acc;
      }, {});
    });
    test.each([
      {
        sortBy: 'CREATED_AT',
        sortField: 'time_added',
      },
      {
        sortBy: 'UPDATED_AT',
        sortField: 'time_updated',
      },
      {
        sortBy: 'FAVORITED_AT',
        sortField: 'time_favorited',
      },
      {
        sortBy: 'ARCHIVED_AT',
        sortField: 'time_read',
      },
    ])('by $sortBy works', async ({ sortBy, sortField }) => {
      const variables = {
        sort: { sortBy, sortOrder: 'DESC' },
        pagination: {
          first: 3,
        },
        ...baseVariables,
      };
      const res = await request(app).post(url).set(headers).send({
        query: PAGINATE,
        variables,
      });
      const edges = res.body.data._entities[0].savedItems.edges;
      edges.forEach((edge) => {
        const [actualId, actualTimestamp] = ListPaginationService.decodeCursor(
          edge.cursor,
        );
        expect(actualId).toBe(edge.node.id);
        expect(parseInt(actualTimestamp)).toBe(
          new Date(rowsById[actualId][sortField]).getTime() / 1000,
        );
      });
    });
  });
  describe('cursor generation with nulls', () => {
    const seeder = seeds.mockList('1', {
      count: 20,
      batchSize: 21,
      archiveRate: 0.0,
      favoriteRate: 0.0,
    });
    const batch = seeder.next(); // This gets the whole batch

    beforeAll(async () => {
      await writeDb('list').truncate();
      await Promise.all([writeDb('list').insert(batch.value['list'])]);
    });
    test.each([
      {
        sortBy: 'FAVORITED_AT',
      },
      {
        sortBy: 'ARCHIVED_AT',
      },
    ])('by $sortBy works', async ({ sortBy }) => {
      const variables = {
        sort: { sortBy, sortOrder: 'DESC' },
        pagination: {
          first: 3,
        },
        ...baseVariables,
      };
      const res = await request(app).post(url).set(headers).send({
        query: PAGINATE,
        variables,
      });
      const edges = res.body.data._entities[0].savedItems.edges;
      edges.forEach((edge) => {
        const [actualId, actualTimestamp] = ListPaginationService.decodeCursor(
          edge.cursor,
        );
        expect(actualId).toBe(edge.node.id);
        expect(actualTimestamp).toBeNull();
      });
    });
  });
  it('should return data if item_id is present and resolved_id is 0', async () => {
    await writeDb('list').truncate();
    const date1 = new Date('2020-10-03 10:20:30'); // Consistent date for seeding
    const date2 = new Date('2020-10-03 10:22:30'); // Consistent date for seeding
    const nullDate = '0000-00-00 00:00:00';
    await writeDb('list').insert([
      {
        user_id: 1,
        item_id: 508999,
        resolved_id: 0,
        given_url: 'http://ijk1234',
        title: '',
        time_added: date1,
        time_updated: date2,
        time_read: date1,
        time_favorited: nullDate,
        api_id: 'apiid',
        status: SavedItemStatus.ARCHIVED,
        favorite: 0,
        api_id_updated: 'apiid',
      },
    ]);
    const variables = {
      sort: { sortBy: 'ARCHIVED_AT', sortOrder: 'DESC' },
      pagination: {
        first: 3,
      },
      ...baseVariables,
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_ARCHIVED_ITEMS,
      variables,
    });
    expect(res.body.data?._entities[0].savedItems.totalCount).toBe(1);
    expect(res.body.data?._entities[0].savedItems.edges[0].node.url).toBe(
      'http://ijk1234',
    );
    expect(
      res.body.data?._entities[0].savedItems.edges[0].node.item.__typename,
    ).toBe('PendingItem');
  });
});
