import { writeClient } from '../../../../database/client';
import sinon from 'sinon';
import { ContextManager } from '../../../../server/context';
import { startServer } from '../../../../server/apollo';
import { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import request from 'supertest';
import { mockParserGetItemIdRequest } from '../../../utils/parserMocks';

describe('savedItemFavorite mutation', function () {
  const db = writeClient();
  const eventSpy = sinon.spy(ContextManager.prototype, 'emitItemEvent');
  const headers = { userid: '1' };
  const date = new Date('2020-10-03T10:20:30.000Z'); // Consistent date for seeding
  const date1 = new Date('2020-10-03T10:30:30.000Z'); // Consistent date for seeding
  let app: Express;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const FAVORITE_MUTATION = gql`
    mutation savedItemFavorite($givenUrl: Url!, $timestamp: ISOString!) {
      savedItemFavorite(givenUrl: $givenUrl, timestamp: $timestamp) {
        id
        url
        isFavorite
        favoritedAt
        _updatedAt
      }
    }
  `;

  beforeEach(async () => {
    await db('list').truncate();
    const inputData = [
      { item_id: 0, status: 0, favorite: 0 },
      { item_id: 1, status: 0, favorite: 0 },
      // One that's already favorite
      { item_id: 2, status: 1, favorite: 1 },
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
        time_favorited: row.favorite === 1 ? date : '0000-00-00 00:00:00',
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

  it('should favorite a non-favorite savedItem', async () => {
    const givenUrl = 'http://1';
    mockParserGetItemIdRequest(givenUrl, '1');
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const testEpoch = new Date(testTimestamp).getTime() / 1000;
    const variables = {
      givenUrl,
      timestamp: testTimestamp,
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(FAVORITE_MUTATION), variables });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.savedItemFavorite).toStrictEqual({
      id: '1',
      url: givenUrl,
      isFavorite: true,
      favoritedAt: testEpoch,
      _updatedAt: testEpoch,
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
      .send({ query: print(FAVORITE_MUTATION), variables });
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({
        extensions: { code: 'NOT_FOUND' },
        message: expect.stringContaining('SavedItem does not exist'),
      }),
    );
  });
  it('should not emit an favorite event if the savedItem did not have an itemId', async () => {
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
      .send({ query: print(FAVORITE_MUTATION), variables });
    expect(eventSpy.callCount).toEqual(0);
  });
  it('throws NotFound error and does not emit event if the savedItem does not exist in the pocket user saves', async () => {
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
      .send({ query: print(FAVORITE_MUTATION), variables });
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({
        extensions: { code: 'NOT_FOUND' },
        message: expect.stringContaining('SavedItem does not exist'),
      }),
    );
    expect(eventSpy.callCount).toEqual(0);
  });
  it('should emit an favorite event when a savedItem is favorited', async () => {
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
      .send({ query: print(FAVORITE_MUTATION), variables });
    expect(eventSpy.callCount).toEqual(1);
    expect(eventSpy.firstCall.args).toStrictEqual([
      'FAVORITE_ITEM',
      expect.objectContaining({
        url: givenUrl,
        time_updated: new Date(testTimestamp),
      }),
    ]);
  });
  // This might change to a no-op later, but let's stick with current behavior of
  // updatesavedItemFavorite and have it documented in tests
  it('works even if the savedItem is already favorited, updating timestamps and emitting event', async () => {
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
      .send({ query: print(FAVORITE_MUTATION), variables });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.savedItemFavorite).toStrictEqual({
      id: '2',
      url: givenUrl,
      isFavorite: true,
      favoritedAt: testEpoch,
      _updatedAt: testEpoch,
    });
    expect(eventSpy.callCount).toEqual(1);
    expect(eventSpy.firstCall.args).toStrictEqual([
      'FAVORITE_ITEM',
      expect.objectContaining({
        url: givenUrl,
        time_updated: new Date(testTimestamp),
      }),
    ]);
  });
});
