import { print } from 'graphql';
import request from 'supertest';

import { ApolloServer } from '@apollo/server';
import { List, Visibility, PrismaClient } from '.prisma/client';

import { IPublicContext } from '../../context';
import { startServer } from '../../../express';
import { client } from '../../../database/client';
import {
  clearDb,
  createShareableListHelper,
  createShareableListItemHelper,
  mockRedisServer,
} from '../../../test/helpers';
import { GET_SHAREABLE_LIST_PAGINATED_ITEMS } from './sample-queries.gql';
import { Application } from 'express';
describe('ListItems on a List', () => {
  let app: Application;
  let server: ApolloServer<IPublicContext>;
  let graphQLUrl: string;
  let db: PrismaClient;
  let largeList: List;
  let emptyList: List;

  // all other tests use public users
  const publicUserHeaders = {
    userId: '987654321',
  };

  beforeAll(async () => {
    mockRedisServer();
    // port 0 tells express to dynamically assign an available port
    ({
      app,
      publicServer: server,
      publicUrl: graphQLUrl,
    } = await startServer(0));
    db = client();
    await clearDb(db);
    largeList = await createShareableListHelper(db, {
      userId: parseInt(publicUserHeaders.userId),
      title: 'Large list',
      // set list item notes public
      listItemNoteVisibility: Visibility.PUBLIC,
      updatedAt: new Date(),
    });
    emptyList = await createShareableListHelper(db, {
      userId: parseInt(publicUserHeaders.userId),
      title: 'Empty list',
      // set list item notes public
      listItemNoteVisibility: Visibility.PUBLIC,
      updatedAt: new Date(),
    });
    await Promise.all(
      [...Array(40).keys()].map((ix) =>
        createShareableListItemHelper(db, {
          list: largeList,
          sortOrder: ix,
        }),
      ),
    );

    mockRedisServer();
    // port 0 tells express to dynamically assign an available port
    ({
      app,
      publicServer: server,
      publicUrl: graphQLUrl,
    } = await startServer(0));
    db = client();
  });

  afterAll(async () => {
    await db.$disconnect();
    await server.stop();
  });

  it.each([
    { name: 'first', pagination: { first: 10 } },
    { name: 'last', pagination: { last: 10 } },
  ])(
    'returns empty result if there are no items associated to a list - $name',
    async ({ pagination }) => {
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(GET_SHAREABLE_LIST_PAGINATED_ITEMS),
          variables: {
            externalId: emptyList.externalId,
            pagination,
          },
        });
      const expected = {
        externalId: emptyList.externalId,
        items: {
          totalCount: 0,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: expect.toBeNil(),
            endCursor: expect.toBeNil(),
          },
          edges: expect.toBeArrayOfSize(0),
        },
      };
      const data = result.body.data.shareableList;
      expect(data).toEqual(expected);
    },
  );

  it('fetches a page of items associated to a list -- first ', async () => {
    const result = await request(app)
      .post(graphQLUrl)
      .set(publicUserHeaders)
      .send({
        query: print(GET_SHAREABLE_LIST_PAGINATED_ITEMS),
        variables: {
          externalId: largeList.externalId,
          pagination: { first: 10 },
        },
      });
    const expected = {
      externalId: largeList.externalId,
      items: {
        totalCount: 40,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: expect.toBeString(),
          endCursor: expect.toBeString(),
        },
        edges: expect.toBeArrayOfSize(10),
      },
    };
    const data = result.body.data.shareableList;
    expect(data).toEqual(expected);
    // Spot-checking the edges - sortOrder was seeded so it should start and end with 0 and 9
    expect(data.items.edges[0].node.sortOrder).toEqual(0);
    expect(data.items.edges[9].node.sortOrder).toEqual(9);
  });
  it('fetches a page of results (first/after) and ends the result set', async () => {
    // Fetch for the next cursor
    const firstPageResult = await request(app)
      .post(graphQLUrl)
      .set(publicUserHeaders)
      .send({
        query: print(GET_SHAREABLE_LIST_PAGINATED_ITEMS),
        variables: {
          externalId: largeList.externalId,
          pagination: { first: 30 },
        },
      });
    const nextCursor =
      firstPageResult.body.data.shareableList.items.pageInfo.endCursor;
    const nextPageResult = await request(app)
      .post(graphQLUrl)
      .set(publicUserHeaders)
      .send({
        query: print(GET_SHAREABLE_LIST_PAGINATED_ITEMS),
        variables: {
          externalId: largeList.externalId,
          pagination: { first: 30, after: nextCursor },
        },
      });
    const expected = {
      externalId: largeList.externalId,
      items: {
        totalCount: 40,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: true,
          startCursor: expect.toBeString(),
          endCursor: expect.toBeString(),
        },
        edges: expect.toBeArrayOfSize(10),
      },
    };
    const data = nextPageResult.body.data.shareableList;
    expect(data).toEqual(expected);
    // Spot-checking the edges - sortOrder was seeded so it should start and end with 30 and 39
    expect(data.items.edges[0].node.sortOrder).toEqual(30);
    expect(data.items.edges[9].node.sortOrder).toEqual(39);
  });
  it('fetches a page of results (first/after) with more results left', async () => {
    const firstPageResult = await request(app)
      .post(graphQLUrl)
      .set(publicUserHeaders)
      .send({
        query: print(GET_SHAREABLE_LIST_PAGINATED_ITEMS),
        variables: {
          externalId: largeList.externalId,
          pagination: { first: 10 },
        },
      });
    const nextCursor =
      firstPageResult.body.data.shareableList.items.pageInfo.endCursor;
    const nextPageResult = await request(app)
      .post(graphQLUrl)
      .set(publicUserHeaders)
      .send({
        query: print(GET_SHAREABLE_LIST_PAGINATED_ITEMS),
        variables: {
          externalId: largeList.externalId,
          pagination: { first: 10, after: nextCursor },
        },
      });
    const expected = {
      externalId: largeList.externalId,
      items: {
        totalCount: 40,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: true,
          startCursor: expect.toBeString(),
          endCursor: expect.toBeString(),
        },
        edges: expect.toBeArrayOfSize(10),
      },
    };
    const data = nextPageResult.body.data.shareableList;
    expect(data).toEqual(expected);
    // Spot-checking the edges - sortOrder was seeded so it should start and end with 10 and 19
    expect(data.items.edges[0].node.sortOrder).toEqual(10);
    expect(data.items.edges[9].node.sortOrder).toEqual(19);
  });
  it('fetches the previous page of results (before/last) with more results left', async () => {
    const firstPageResult = await request(app)
      .post(graphQLUrl)
      .set(publicUserHeaders)
      .send({
        query: print(GET_SHAREABLE_LIST_PAGINATED_ITEMS),
        variables: {
          externalId: largeList.externalId,
          pagination: { last: 10 },
        },
      });
    const nextCursor =
      firstPageResult.body.data.shareableList.items.pageInfo.startCursor;
    const nextPageResult = await request(app)
      .post(graphQLUrl)
      .set(publicUserHeaders)
      .send({
        query: print(GET_SHAREABLE_LIST_PAGINATED_ITEMS),
        variables: {
          externalId: largeList.externalId,
          pagination: { last: 10, before: nextCursor },
        },
      });
    const expected = {
      externalId: largeList.externalId,
      items: {
        totalCount: 40,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: true,
          startCursor: expect.toBeString(),
          endCursor: expect.toBeString(),
        },
        edges: expect.toBeArrayOfSize(10),
      },
    };
    const data = nextPageResult.body.data.shareableList;
    expect(data).toEqual(expected);
    // Spot-checking the edges - sortOrder was seeded so it should start and end with 20 and 29
    expect(data.items.edges[0].node.sortOrder).toEqual(20);
    expect(data.items.edges[9].node.sortOrder).toEqual(29);
  });
  it('fetches the previous page of results (before/last) and ends the result set', async () => {
    const firstPageResult = await request(app)
      .post(graphQLUrl)
      .set(publicUserHeaders)
      .send({
        query: print(GET_SHAREABLE_LIST_PAGINATED_ITEMS),
        variables: {
          externalId: largeList.externalId,
          pagination: { last: 30 },
        },
      });
    const nextCursor =
      firstPageResult.body.data.shareableList.items.pageInfo.startCursor;
    const nextPageResult = await request(app)
      .post(graphQLUrl)
      .set(publicUserHeaders)
      .send({
        query: print(GET_SHAREABLE_LIST_PAGINATED_ITEMS),
        variables: {
          externalId: largeList.externalId,
          pagination: { last: 30, before: nextCursor },
        },
      });
    const expected = {
      externalId: largeList.externalId,
      items: {
        totalCount: 40,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: expect.toBeString(),
          endCursor: expect.toBeString(),
        },
        edges: expect.toBeArrayOfSize(10),
      },
    };
    const data = nextPageResult.body.data.shareableList;
    expect(data).toEqual(expected);
    // Spot-checking the edges - sortOrder was seeded so it should start and end with 0 and 9
    expect(data.items.edges[0].node.sortOrder).toEqual(0);
    expect(data.items.edges[9].node.sortOrder).toEqual(9);
  });
  it('fetches the last page of results', async () => {
    // Run the query we're testing
    const result = await request(app)
      .post(graphQLUrl)
      .set(publicUserHeaders)
      .send({
        query: print(GET_SHAREABLE_LIST_PAGINATED_ITEMS),
        variables: {
          externalId: largeList.externalId,
          pagination: { last: 10 },
        },
      });
    const expected = {
      externalId: largeList.externalId,
      items: {
        totalCount: 40,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: true,
          startCursor: expect.toBeString(),
          endCursor: expect.toBeString(),
        },
        edges: expect.toBeArrayOfSize(10),
      },
    };
    const data = result.body.data.shareableList;
    expect(data).toEqual(expected);
    // Spot-checking the edges - sortOrder was seeded so it should start and end with 30 and 39
    expect(data.items.edges[0].node.sortOrder).toEqual(30);
    expect(data.items.edges[9].node.sortOrder).toEqual(39);
  });
});
