import { timeIt, seeds } from '@pocket-tools/backend-benchmarking';
import Client from '../../../database/client.js';
import { ContextManager } from '../../../server/context.js';
import { startServer } from '../../../server/apollo.js';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';

const GET_SAVED_ITEMS = `
  query getSavedItem(
    $id: ID!
    $filter: SavedItemsFilter
    $sort: SavedItemsSort
    $pagination: PaginationInput
  ) {
    _entities(representations: { id: $id, __typename: "User" }) {
      ... on User {
        savedItems(pagination: $pagination, filter: $filter, sort: $sort) {
          edges {
            node {
              url
              favoritedAt
            }
          }
          pageInfo {
            startCursor
            endCursor
            hasNextPage
            hasPreviousPage
          }
        }
      }
    }
  }
`;
describe.skip('temp table with new list pagination - benchmarking', () => {
  const writeDb = Client.writeClient();
  const readDb = Client.readClient();
  const headers = { userid: '1' };
  const variables = {
    id: '1',
    filter: { contentType: 'ARTICLE' },
    sort: { sortBy: 'CREATED_AT', sortOrder: 'DESC' },
    pagination: { first: 30 },
  };
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));

    await Promise.all([
      writeDb('list').truncate(),
      writeDb('readitla_b.items_extended').truncate(),
    ]);
    const seeder = seeds.mockList('1', { count: 50000, batchSize: 5000 });
    let batch = seeder.next();
    while (!batch.done) {
      await Promise.all([
        writeDb('list').insert(batch.value['list']),
        writeDb('readitla_b.items_extended').insert(
          batch.value['items_extended'],
        ),
      ]);
      batch = seeder.next();
    }
  });
  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    await server.stop();
  });
  it('first', async () => {
    await timeIt(
      async () =>
        await request(app).post(url).set(headers).send({
          query: GET_SAVED_ITEMS,
          variables,
        }),
      { name: 'first', times: 20, printToConsole: true, returnValues: true },
    )();
  });
  it('first/after', async () => {
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    const cursor = res.body.data?._entities[0].savedItems.pageInfo.endCursor;
    await timeIt(
      async () =>
        await request(app)
          .post(url)
          .set(headers)
          .send({
            query: GET_SAVED_ITEMS,
            variables: {
              ...variables,
              pagination: { first: 30, after: cursor },
            },
          }),
      { name: 'first/after', times: 20, returnValues: true },
    )();
  });
  it('last', async () => {
    await timeIt(
      async () =>
        await await request(app)
          .post(url)
          .set(headers)
          .send({
            query: GET_SAVED_ITEMS,
            variables: {
              ...variables,
              pagination: { last: 30 },
            },
          }),
      { name: 'last', times: 20 },
    )();
  });
  it('last/before', async () => {
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: GET_SAVED_ITEMS,
        variables: {
          ...variables,
          pagination: { last: 30 },
        },
      });
    const cursor = res.body.data?._entities[0].savedItems.pageInfo.startCursor;
    await timeIt(
      async () =>
        await request(app)
          .post(url)
          .set(headers)
          .send({
            query: GET_SAVED_ITEMS,
            variables: {
              ...variables,
              pagination: { last: 30, before: cursor },
            },
          }),
      { name: 'last/before', times: 20 },
    )();
  });
});
