import { ApolloServer } from '@apollo/server';
import { ContextManager } from '../../../server/context';
import { readClient, writeClient } from '../../../database/client';
import { startServer } from '../../../server/apollo';
import { Application } from 'express';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import request from 'supertest';

describe('PocketSave.Item', () => {
  const writeDb = writeClient();
  const readDb = readClient();
  const headers = { userid: '1' };
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const GET_ITEM_POCKET_SAVE = gql`
    query getPocketSave($userId: ID!, $itemIds: [ID!]!) {
      _entities(representations: { id: $userId, __typename: "User" }) {
        ... on User {
          saveById(ids: $itemIds) {
            ... on PocketSave {
              item {
                ... on PendingItem {
                  itemId
                  url
                  status
                  __typename
                }
                ... on Item {
                  givenUrl
                  __typename
                }
              }
            }
          }
        }
      }
    }
  `;

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    await server.stop();
  });

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
    await writeDb('list').truncate();
    await writeDb('list').insert([
      {
        api_id: '012',
        api_id_updated: '012',
        favorite: 0,
        given_url: 'https://www.youtube.com/watch?v=nsNMP6_Q0Js',
        item_id: 55,
        resolved_id: 55,
        status: 0,
        time_added: new Date(),
        time_favorited: new Date(),
        time_read: new Date(),
        time_updated: new Date(),
        title: `Mon Coeur s'ouvre a ta voix`,
        user_id: 1,
      },
      {
        api_id: '012',
        api_id_updated: '012',
        favorite: 0,
        given_url: 'https://www.youtube.com/watch?v=w8tVsfPPxyU',
        item_id: 22,
        resolved_id: 0,
        status: 0,
        time_added: new Date(),
        time_favorited: new Date(),
        time_read: new Date(),
        time_updated: new Date(),
        title: `Un bel dì vedremo`,
        user_id: 1,
      },
    ]);
  });
  it('returns a PendingItem if resolvedId is 0', async () => {
    const variables = {
      userId: '1',
      itemIds: ['22'],
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_ITEM_POCKET_SAVE),
        variables,
      });
    const expected = {
      status: 'UNRESOLVED',
      itemId: '22',
      url: 'https://www.youtube.com/watch?v=w8tVsfPPxyU',
      __typename: 'PendingItem',
    };
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data._entities[0].saveById[0].item).toStrictEqual(expected);
  });
  it('returns an Item if resolvedId is nonzero integer', async () => {
    const variables = {
      userId: '1',
      itemIds: ['55'],
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_ITEM_POCKET_SAVE),
        variables,
      });
    const expected = {
      givenUrl: 'https://www.youtube.com/watch?v=nsNMP6_Q0Js',
      __typename: 'Item',
    };
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data._entities[0].saveById[0].item).toStrictEqual(expected);
  });
});
