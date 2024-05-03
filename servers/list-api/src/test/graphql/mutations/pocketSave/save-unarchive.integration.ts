import { readClient, writeClient } from '../../../../database/client.js';
import { ContextManager } from '../../../../server/context.js';
import { startServer } from '../../../../server/apollo.js';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import request from 'supertest';

describe('saveUnArchive mutation', function () {
  const writeDb = writeClient();
  const readDb = readClient();
  const headers = { userid: '1' };
  const date = new Date('2020-10-03T10:20:30.000Z'); // Consistent date for seeding
  const date1 = new Date('2020-10-03T10:30:30.000Z'); // Consistent date for seeding
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const UNARCHIVE_MUTATION = gql`
    mutation saveUnArchive($id: [ID!]!, $timestamp: ISOString!) {
      saveUnArchive(id: $id, timestamp: $timestamp) {
        save {
          id
          archived
          archivedAt
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
      { item_id: 0, status: 1, favorite: 0 },
      { item_id: 1, status: 1, favorite: 0 },
      { item_id: 2, status: 0, favorite: 1 },
    ].map((row) => {
      return {
        ...row,
        user_id: 1,
        resolved_id: row.item_id,
        given_url: `http://${row.item_id}`,
        title: `title ${row.item_id}`,
        time_added: date,
        time_updated: date1,
        time_read: row.status === 1 ? date : '0000-00-00 00:00:00',
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

  it('should unarchive one save', async () => {
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      id: ['1'],
      timestamp: testTimestamp,
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(UNARCHIVE_MUTATION), variables });

    expect(res).not.toBeUndefined();
    expect(res.body.data.saveUnArchive.save).toBeArrayOfSize(1);
    expect(res.body.data.saveUnArchive.errors).toBeArrayOfSize(0);
    const actual = res.body.data.saveUnArchive.save[0];
    expect(actual).toStrictEqual({
      id: '1',
      archived: false,
      archivedAt: null,
      updatedAt: testTimestamp,
    });
  });

  it('should fail the entire batch if one fails (NOT_FOUND)', async () => {
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      id: ['123123'],
      timestamp: testTimestamp,
      updatedAt: testTimestamp,
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(UNARCHIVE_MUTATION), variables });

    expect(res).not.toBeUndefined();
    expect(res.body.data.saveUnArchive.save).toBeArrayOfSize(0);
    const errors = res.body.data.saveUnArchive.errors;
    expect(errors).toBeArrayOfSize(1);
    expect(errors[0]).toStrictEqual({
      __typename: 'NotFound',
      message: 'Entity identified by key=id, value=123123 was not found.',
      path: 'saveUnArchive',
    });
  });

  it('should unarchive multiple saves', async () => {
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      id: ['0', '1'],
      timestamp: testTimestamp,
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(UNARCHIVE_MUTATION), variables });

    const expected = {
      save: [
        {
          id: '0',
          archived: false,
          archivedAt: null,
          updatedAt: testTimestamp,
        },
        {
          id: '1',
          archived: false,
          archivedAt: null,
          updatedAt: testTimestamp,
        },
      ],
      errors: [],
    };
    const data = res.body.data.saveUnArchive;
    expect(data.save).toIncludeSameMembers(expected.save);
    expect(data.errors).toBeArrayOfSize(0);
  });

  it('should not fail if trying to unarchive a save that is already archived (no-op)', async () => {
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      id: ['2'],
      timestamp: testTimestamp,
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(UNARCHIVE_MUTATION), variables });

    const data = res.body.data.saveUnArchive.save;
    expect(data).toMatchObject([
      {
        archived: false,
        archivedAt: null,
        updatedAt: date1.toISOString(),
      },
    ]);
    expect(res.body.data.saveUnArchive.errors).toBeArrayOfSize(0);
  });
});
