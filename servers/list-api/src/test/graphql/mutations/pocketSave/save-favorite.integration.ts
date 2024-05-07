import Client from '../../../../database/client.js';
import { ContextManager } from '../../../../server/context.js';
import { startServer } from '../../../../server/apollo.js';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import request from 'supertest';
import { jest } from '@jest/globals';

describe('saveFavorite mutation', function () {
  const writeDb = Client.writeClient();
  const readDb = Client.readClient();
  const headers = { userid: '1' };
  const date = new Date('2020-10-03T10:20:30.000Z'); // Consistent date for seeding
  const date1 = new Date('2020-10-03T10:30:30.000Z'); // Consistent date for seeding
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const SAVE_FAVORITE = gql`
    mutation saveFavorite($id: [ID!]!, $timestamp: ISOString!) {
      saveFavorite(id: $id, timestamp: $timestamp) {
        save {
          id
          favorite
          favoritedAt
          updatedAt
        }
        errors {
          __typename
          ... on BaseError {
            path
            message
          }
        }
      }
    }
  `;

  beforeEach(async () => {
    await writeDb('list').truncate();
    const inputData = [
      { item_id: 0, favorite: 0 },
      { item_id: 1, favorite: 0 },
      // One that's already favorited
      { item_id: 2, favorite: 1 },
    ].map((row) => {
      return {
        ...row,
        status: 0,
        user_id: 1,
        resolved_id: row.item_id,
        given_url: `http://${row.item_id}`,
        title: `title ${row.item_id}`,
        time_added: date,
        time_updated: date1,
        time_read: row.favorite === 1 ? date : '0000-00-00 00:00:00',
        time_favorited: date,
        api_id: 'apiid',
        api_id_updated: 'apiid',
      };
    });
    await writeDb('list').insert(inputData);
  });

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
  });

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    jest.restoreAllMocks();
    await server.stop();
  });

  afterEach(() => jest.clearAllMocks());

  it('should favorite one save', async () => {
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      id: ['1'],
      timestamp: testTimestamp,
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(SAVE_FAVORITE), variables });

    expect(res).not.toBeUndefined();
    expect(res.body.data.saveFavorite.save).toBeArrayOfSize(1);
    expect(res.body.data.saveFavorite.errors).toBeArrayOfSize(0);
    const actual = res.body.data.saveFavorite.save[0];
    expect(actual).toStrictEqual({
      id: '1',
      favorite: true,
      favoritedAt: testTimestamp,
      updatedAt: testTimestamp,
    });
  });

  it('should favorite multiple saves', async () => {
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      id: ['0', '1'],
      timestamp: testTimestamp,
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(SAVE_FAVORITE), variables });

    const expected = {
      save: [
        {
          id: '0',
          favorite: true,
          favoritedAt: testTimestamp,
          updatedAt: testTimestamp,
        },
        {
          id: '1',
          favorite: true,
          favoritedAt: testTimestamp,
          updatedAt: testTimestamp,
        },
      ],
      errors: [],
    };
    const data = res.body.data.saveFavorite;
    expect(data.save).toIncludeSameMembers(expected.save);
    expect(data.errors).toBeArrayOfSize(0);
  });

  it('should fail the entire batch if one fails (NOT_FOUND)', async () => {
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      id: ['123123'],
      timestamp: testTimestamp,
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(SAVE_FAVORITE), variables });

    expect(res).not.toBeUndefined();
    expect(res.body.data.saveFavorite.save).toBeArrayOfSize(0);
    const errors = res.body.data.saveFavorite.errors;
    expect(errors).toBeArrayOfSize(1);
    expect(errors[0]).toStrictEqual({
      __typename: 'NotFound',
      message: 'Entity identified by key=id, value=123123 was not found.',
      path: 'saveFavorite',
    });
  });

  it('should not fail if trying to favorite a save that is already favorited (no-op)', async () => {
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      id: ['2'],
      timestamp: testTimestamp,
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(SAVE_FAVORITE), variables });

    const data = res.body.data.saveFavorite.save;
    expect(data).toMatchObject([
      {
        favorite: true,
        favoritedAt: date.toISOString(),
      },
    ]);
    expect(res.body.data.saveFavorite.errors).toBeArrayOfSize(0);
  });
  //todo: event emission
  //todo: constraint validation
});
