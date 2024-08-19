import { readClient, writeClient } from '../../../../database/client';
import { ContextManager } from '../../../../server/context';
import { startServer } from '../../../../server/apollo';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import request from 'supertest';
import { mockParserGetItemIdRequest } from '../../../utils/parserMocks';
import { restore, cleanAll } from 'nock';

describe('savedItemDelete mutation', function () {
  const writeDb = writeClient();
  const readDb = readClient();
  const eventSpy = jest.spyOn(ContextManager.prototype, 'emitItemEvent');
  const headers = { userid: '1' };
  const date = new Date('2020-10-03T10:20:30.000Z'); // Consistent date for seeding
  const date1 = new Date('2020-10-03T10:30:30.000Z'); // Consistent date for seeding
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const GET_SAVE_QUERY = gql`
    query getSavedItem($itemId: ID!) {
      _entities(representations: { id: "1", __typename: "User" }) {
        ... on User {
          savedItemById(id: $itemId) {
            url
            status
            _updatedAt
            _deletedAt
            tags {
              name
            }
          }
        }
      }
    }
  `;

  const DELETE_MUTATION = gql`
    mutation savedItemDelete($givenUrl: Url!, $timestamp: ISOString!) {
      savedItemDelete(givenUrl: $givenUrl, timestamp: $timestamp)
    }
  `;

  beforeEach(async () => {
    await writeDb('list').truncate();
    await writeDb('item_tags').truncate();
    const inputData = [
      { item_id: 0, status: 0, favorite: 0 },
      { item_id: 1, status: 1, favorite: 0 },
      // One that's already deleted
      { item_id: 2, status: 2, favorite: 0 },
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
    // Add some tags which can be deleted
    const tagData = ['0', '1', '2'].flatMap((id) => {
      const tagBase = {
        user_id: 1,
        status: 1,
        time_added: date,
        time_updated: date,
        api_id: 'apiid',
        api_id_updated: 'apiid',
      };
      return [
        {
          ...tagBase,
          tag: 'odd',
          item_id: id,
        },
        {
          ...tagBase,
          tag: 'taxi',
          item_id: id,
        },
      ];
    });
    await writeDb('item_tags').insert(tagData);
  });

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
  });

  afterAll(async () => {
    await server.stop();
    await writeDb.destroy();
    await readDb.destroy();
    restore();
    cleanAll();
    jest.restoreAllMocks();
  });

  afterEach(() => jest.clearAllMocks());

  it('should "soft-delete" an "unread" savedItem', async () => {
    const givenUrl = 'http://0';
    mockParserGetItemIdRequest(givenUrl, '0');
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const testEpoch = new Date(testTimestamp).getTime() / 1000;
    const variables = {
      givenUrl,
      timestamp: testTimestamp,
    };

    const deleteRes = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(DELETE_MUTATION), variables });

    const roundTripRes = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(GET_SAVE_QUERY), variables: { itemId: '0' } });

    expect(deleteRes.body.errors).toBeUndefined();
    expect(deleteRes.body.data.savedItemDelete).toStrictEqual(givenUrl);
    expect(roundTripRes.body.data._entities[0].savedItemById).toStrictEqual({
      url: givenUrl,
      status: 'DELETED',
      _updatedAt: testEpoch,
      _deletedAt: testEpoch,
      tags: [],
    });
  });
  it('should "soft-delete" an "archived" savedItem', async () => {
    const givenUrl = 'http://1';
    mockParserGetItemIdRequest(givenUrl, '1');
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const testEpoch = new Date(testTimestamp).getTime() / 1000;
    const variables = {
      givenUrl,
      timestamp: testTimestamp,
    };

    const deleteRes = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(DELETE_MUTATION), variables });

    const roundTripRes = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(GET_SAVE_QUERY), variables: { itemId: '1' } });

    expect(deleteRes.body.errors).toBeUndefined();
    expect(deleteRes.body.data.savedItemDelete).toStrictEqual(givenUrl);
    expect(roundTripRes.body.data._entities[0].savedItemById).toStrictEqual({
      url: givenUrl,
      status: 'DELETED',
      _updatedAt: testEpoch,
      _deletedAt: testEpoch,
      tags: [],
    });
  });
  it('throws NotFound error if the savedItem does not have an itemId', async () => {
    const givenUrl = 'http://999';
    mockParserGetItemIdRequest(givenUrl, null);
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      givenUrl,
      timestamp: testTimestamp,
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(DELETE_MUTATION), variables });
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({
        extensions: { code: 'NOT_FOUND' },
        message: expect.stringContaining('SavedItem does not exist'),
      }),
    );
  });
  it('should not emit a delete event if the savedItem did not have an itemId', async () => {
    const givenUrl = 'http://999';
    mockParserGetItemIdRequest(givenUrl, null);
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      givenUrl,
      timestamp: testTimestamp,
    };
    await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(DELETE_MUTATION), variables });
    expect(eventSpy).toHaveBeenCalledTimes(0);
  });
  it('throws NotFound error and does not emit event if the savedItem is not in the user saves', async () => {
    const givenUrl = 'http://999';
    mockParserGetItemIdRequest(givenUrl, '999');
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      givenUrl,
      timestamp: testTimestamp,
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(DELETE_MUTATION), variables });
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({
        extensions: { code: 'NOT_FOUND' },
        message: expect.stringContaining('SavedItem does not exist'),
      }),
    );
    expect(eventSpy).toHaveBeenCalledTimes(0);
  });
  it('should emit a delete event when a savedItem is deleted', async () => {
    const givenUrl = 'http://1';
    mockParserGetItemIdRequest(givenUrl, '1');
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      givenUrl,
      timestamp: testTimestamp,
    };
    await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(DELETE_MUTATION), variables });
    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy.mock.calls[0]).toStrictEqual([
      'DELETE_ITEM',
      expect.objectContaining({
        url: givenUrl,
        time_updated: new Date(testTimestamp),
      }),
    ]);
  });
  // This might change to a no-op later, but let's stick with current behavior of
  // updatesavedItemDelete and have it documented in tests
  it('works even if the savedItem is already "soft-deleted", updating timestamps and emitting event', async () => {
    const givenUrl = 'http://2';
    mockParserGetItemIdRequest(givenUrl, '2');
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const testEpoch = new Date(testTimestamp).getTime() / 1000;
    const variables = {
      givenUrl,
      timestamp: testTimestamp,
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(DELETE_MUTATION), variables });

    const roundTripRes = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(GET_SAVE_QUERY), variables: { itemId: '2' } });

    expect(roundTripRes.body.data._entities[0].savedItemById).toStrictEqual({
      url: givenUrl,
      status: 'DELETED',
      _updatedAt: testEpoch,
      _deletedAt: testEpoch,
      tags: [],
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.savedItemDelete).toStrictEqual(givenUrl);
    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy.mock.calls[0]).toStrictEqual([
      'DELETE_ITEM',
      expect.objectContaining({
        url: givenUrl,
        time_updated: new Date(testTimestamp),
      }),
    ]);
  });
});
