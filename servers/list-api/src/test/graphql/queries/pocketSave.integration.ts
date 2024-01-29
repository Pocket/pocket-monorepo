import { ApolloServer } from '@apollo/server';
import { ContextManager } from '../../../server/context';
import { readClient, writeClient } from '../../../database/client';
import { startServer } from '../../../server/apollo';
import { Application } from 'express';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import request from 'supertest';

describe('getPocketSaveByItemId', () => {
  const writeDb = writeClient();
  const readDb = readClient();
  const headers = { userid: '1' };
  const date1 = new Date('2008-10-21 13:57:01');
  const date2 = new Date('0000-00-00 00:00:00');
  const date3 = new Date('2008-10-21 14:00:01');
  const date4 = new Date('2012-08-13 15:32:05');
  const date5 = new Date('2008-11-03 08:51:01');
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const GET_POCKET_SAVE = gql`
    query getPocketSave($userId: ID!, $itemIds: [ID!]!) {
      _entities(representations: { id: $userId, __typename: "User" }) {
        ... on User {
          saveById(ids: $itemIds) {
            ... on PocketSave {
              __typename
              archived
              archivedAt
              createdAt
              deletedAt
              favorite
              favoritedAt
              givenUrl
              id
              status
              title
              updatedAt
            }
            ... on NotFound {
              __typename
              message
              key
              value
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
        given_url: 'http://www.ideashower.com/',
        item_id: 55,
        resolved_id: 55,
        status: 0,
        time_added: date1,
        time_favorited: date2,
        time_read: date3,
        time_updated: date4,
        title: 'the Idea Shower',
        user_id: 1,
      },
      {
        api_id_updated: 'apiid',
        api_id: 'apiid',
        favorite: 1,
        given_url: 'http://irctc.co.in/',
        item_id: 987,
        resolved_id: 987,
        status: 2,
        time_added: date5,
        time_favorited: date2,
        time_read: date5,
        time_updated: date5,
        title: '',
        user_id: 1,
      },
      {
        api_id_updated: 'apiid',
        api_id: 'apiid',
        favorite: 1,
        given_url: 'http://www.frameip.com/voip/',
        item_id: 551,
        resolved_id: 551,
        time_added: date5,
        time_favorited: date5,
        time_read: date5,
        time_updated: date5,
        title: 'Tout sur la voip',
        status: 1,
        user_id: 1,
      },
    ]);
  });

  it('should return a single pocket save with all appropriate fields', async () => {
    const variables = {
      userId: '1',
      itemIds: ['55'],
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_POCKET_SAVE),
        variables,
      });
    expect(res.body.data?._entities[0].saveById[0].archived).toBe(false);
    expect(res.body.data?._entities[0].saveById[0].archivedAt).toBe(null);
    expect(res.body.data?._entities[0].saveById[0].createdAt).toBe(
      date1.toISOString(),
    );
    expect(res.body.data?._entities[0].saveById[0].deletedAt).toBe(null);
    expect(res.body.data?._entities[0].saveById[0].favorite).toBe(false);
    expect(res.body.data?._entities[0].saveById[0].favoritedAt).toBe(null);
    expect(res.body.data?._entities[0].saveById[0].givenUrl).toBe(
      'http://www.ideashower.com/',
    );
    expect(res.body.data?._entities[0].saveById[0].id).toBe('55');
    expect(res.body.data?._entities[0].saveById[0].status).toBe('UNREAD');
    expect(res.body.data?._entities[0].saveById[0].title).toBe(
      'the Idea Shower',
    );
    expect(res.body.data?._entities[0].saveById[0].updatedAt).toBe(
      date4.toISOString(),
    );
  });
  it('should return multiple pocket saves with all appropriate fields', async () => {
    const variables = {
      userId: '1',
      itemIds: ['55', '987'],
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_POCKET_SAVE),
        variables,
      });
    expect(res.body.data?._entities[0].saveById).toContainEqual({
      __typename: 'PocketSave',
      archived: false,
      archivedAt: null,
      createdAt: date1.toISOString(),
      deletedAt: null,
      favorite: false,
      favoritedAt: null,
      givenUrl: 'http://www.ideashower.com/',
      id: '55',
      status: 'UNREAD',
      title: 'the Idea Shower',
      updatedAt: date4.toISOString(),
    });
    expect(res.body.data?._entities[0].saveById).toContainEqual({
      __typename: 'PocketSave',
      archived: false,
      archivedAt: null,
      createdAt: date5.toISOString(),
      deletedAt: date5.toISOString(),
      favorite: true,
      favoritedAt: null,
      givenUrl: 'http://irctc.co.in/',
      id: '987',
      status: 'DELETED',
      title: '',
      updatedAt: date5.toISOString(),
    });
  });
  it('should return error as data if no item is found', async () => {
    const variables = {
      userId: '1',
      itemIds: ['10'],
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_POCKET_SAVE),
        variables,
      });
    expect(res.body.data?._entities[0].saveById[0]).toEqual({
      __typename: 'NotFound',
      message: 'Entity identified by key=id, value=10 was not found.',
      key: 'id',
      value: '10',
    });
    expect(res.body.errors).toBe(undefined);
  });
  it('should return error as data for not found item & data for found item', async () => {
    const variables = {
      userId: '1',
      itemIds: ['10', '55'],
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_POCKET_SAVE),
        variables,
      });
    expect(res.body.data?._entities[0].saveById).toContainEqual({
      __typename: 'PocketSave',
      archived: false,
      archivedAt: null,
      createdAt: date1.toISOString(),
      deletedAt: null,
      favorite: false,
      favoritedAt: null,
      givenUrl: 'http://www.ideashower.com/',
      id: '55',
      status: 'UNREAD',
      title: 'the Idea Shower',
      updatedAt: date4.toISOString(),
    });
    expect(res.body.data?._entities[0].saveById).toContainEqual({
      __typename: 'NotFound',
      message: 'Entity identified by key=id, value=10 was not found.',
      key: 'id',
      value: '10',
    });
    expect(res.body.errors).toBe(undefined);
  });
  it('should have deletedAt field if an item is deleted', async () => {
    const variables = {
      userId: '1',
      itemIds: ['987'],
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_POCKET_SAVE),
        variables,
      });
    expect(res.body.data?._entities[0].saveById[0].deletedAt).toBe(
      date5.toISOString(),
    );
  });
  it('should resolve archived properly', async () => {
    const archivedVars = {
      userId: '1',
      itemIds: ['551'],
    };
    const nonArchivedVars = {
      userId: '1',
      itemIds: ['55'],
    };
    const archivedRes = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_POCKET_SAVE),
        variables: archivedVars,
      });
    const nonArchivedRes = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_POCKET_SAVE),
        variables: nonArchivedVars,
      });
    expect(archivedRes.body.data?._entities[0].saveById[0].archived).toBe(true);
    expect(archivedRes.body.data?._entities[0].saveById[0].archivedAt).toBe(
      date5.toISOString(),
    );
    expect(nonArchivedRes.body.data?._entities[0].saveById[0].archived).toBe(
      false,
    );
    expect(nonArchivedRes.body.data?._entities[0].saveById[0].archivedAt).toBe(
      null,
    );
  });
});
