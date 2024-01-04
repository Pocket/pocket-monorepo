import { writeClient } from '../../../database/client';
import sinon from 'sinon';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import request from 'supertest';

describe('saveArchive mutation', function () {
  const db = writeClient();
  const eventSpy = sinon.spy(ContextManager.prototype, 'emitItemEvent');
  const headers = { userid: '1' };
  const date = new Date('2020-10-03T10:20:30.000Z'); // Consistent date for seeding
  const date1 = new Date('2020-10-03T10:30:30.000Z'); // Consistent date for seeding
  let app: Express;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const ARCHIVE_MUTATION = gql`
    mutation saveArchive($id: [ID!]!, $timestamp: ISOString!) {
      saveArchive(id: $id, timestamp: $timestamp) {
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
    await db('list').truncate();
    const inputData = [
      { item_id: 0, status: 0, favorite: 0 },
      { item_id: 1, status: 0, favorite: 0 },
      // One that's already archived
      { item_id: 2, status: 1, favorite: 0 },
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
    await db('list').insert(inputData);
  });

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
  });

  afterAll(async () => {
    await db.destroy();
    sinon.restore();
    await server.stop();
  });

  afterEach(() => sinon.resetHistory());

  it('should archive one save', async () => {
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      id: ['1'],
      timestamp: testTimestamp,
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(ARCHIVE_MUTATION), variables });

    expect(res).not.toBeUndefined();
    expect(res.body.data.saveArchive.save).toBeArrayOfSize(1);
    expect(res.body.data.saveArchive.errors).toBeArrayOfSize(0);
    const actual = res.body.data.saveArchive.save[0];
    expect(actual).toStrictEqual({
      id: '1',
      archived: true,
      archivedAt: testTimestamp,
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
      .send({ query: print(ARCHIVE_MUTATION), variables });

    expect(res).not.toBeUndefined();
    expect(res.body.data.saveArchive.save).toBeArrayOfSize(0);
    const errors = res.body.data.saveArchive.errors;
    expect(errors).toBeArrayOfSize(1);
    expect(errors[0]).toStrictEqual({
      __typename: 'NotFound',
      message: 'Entity identified by key=id, value=123123 was not found.',
      path: 'saveArchive',
    });
  });

  it('should archive multiple saves', async () => {
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      id: ['0', '1'],
      timestamp: testTimestamp,
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(ARCHIVE_MUTATION), variables });

    const expected = {
      save: [
        {
          id: '0',
          archived: true,
          archivedAt: testTimestamp,
          updatedAt: testTimestamp,
        },
        {
          id: '1',
          archived: true,
          archivedAt: testTimestamp,
          updatedAt: testTimestamp,
        },
      ],
      errors: [],
    };
    const data = res.body.data.saveArchive;
    expect(data.save).toIncludeSameMembers(expected.save);
    expect(data.errors).toBeArrayOfSize(0);
  });

  it('should not fail if trying to archive a save that is already archived (no-op)', async () => {
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      id: ['2'],
      timestamp: testTimestamp,
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(ARCHIVE_MUTATION), variables });

    const data = res.body.data.saveArchive.save;
    expect(data).toMatchObject([
      {
        archived: true,
        archivedAt: date.toISOString(),
      },
    ]);
    expect(res.body.data.saveArchive.errors).toBeArrayOfSize(0);
  });
  // TODO: Unskip when archive events are implemented
  it.skip('should emit an archive event for each save archived', async () => {
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      id: ['0', '1'],
      timestamp: testTimestamp,
    };
    await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(ARCHIVE_MUTATION), variables });
    expect(eventSpy.callCount).toEqual(2);
  });
  // TODO: Unskip when archive events are implemented
  it.skip('should not emit an archive event if the save is already archived', async () => {
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      id: ['2'],
      timestamp: testTimestamp,
    };
    await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(ARCHIVE_MUTATION), variables });
    expect(eventSpy.callCount).toEqual(0);
  });
  // TODO: When @constraint annotations are added to schema
  it.todo('should not accept more than 30 input ids');
  it.todo('should require at least one input id');
});
