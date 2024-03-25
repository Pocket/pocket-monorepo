import { readClient, writeClient } from '../../../../database/client';
import { ContextManager } from '../../../../server/context';
import { startServer } from '../../../../server/apollo';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import request from 'supertest';
import { mockParserGetItemIdRequest } from '../../../utils/parserMocks';

describe('savedItemUnDelete mutation', function () {
  const writeDb = writeClient();
  const readDb = readClient();
  const headers = { userid: '1' };
  const date = new Date('2020-10-03T10:20:30.000Z'); // Consistent date for seeding
  const date1 = new Date('2020-10-03T10:30:30.000Z'); // Consistent date for seeding
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const UNDELETE_MUTATION = gql`
    mutation savedItemUnDelete($givenUrl: Url!, $timestamp: ISOString!) {
      savedItemUnDelete(givenUrl: $givenUrl, timestamp: $timestamp) {
        url
        status
        _updatedAt
      }
    }
  `;

  beforeEach(async () => {
    await writeDb('list').truncate();
    await writeDb('item_tags').truncate();
    const inputData = [
      // Already deleted, "unread"
      { item_id: 0, status: 2, favorite: 0, shouldArchive: false },
      // Already deleted, "previously" archived
      { item_id: 1, status: 2, favorite: 0, shouldArchive: true },
      // Not deleted
      { item_id: 2, status: 0, favorite: 0, shouldArchive: false },
    ].map((row) => {
      const { shouldArchive, ...rowData } = row;
      return {
        ...rowData,
        user_id: 1,
        resolved_id: row.item_id,
        given_url: `http://${row.item_id}`,
        title: `title ${row.item_id}`,
        time_added: date,
        time_updated: date1,
        time_read: shouldArchive === true ? date : '0000-00-00 00:00:00',
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
    await server.stop();
    await writeDb.destroy();
    await readDb.destroy();
  });

  it('should "undelete" an "unread" savedItem', async () => {
    const givenUrl = 'http://0';
    mockParserGetItemIdRequest(givenUrl, '0');
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const testEpoch = new Date(testTimestamp).getTime() / 1000;
    const variables = {
      givenUrl,
      timestamp: testTimestamp,
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(UNDELETE_MUTATION), variables });

    expect(res.body.data.savedItemUnDelete).toStrictEqual({
      url: givenUrl,
      status: 'UNREAD',
      _updatedAt: testEpoch,
    });
  });
  it('should "un-delete" a previously archived savedItem, restoring archived status', async () => {
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
      .send({ query: print(UNDELETE_MUTATION), variables });

    expect(res.body.data.savedItemUnDelete).toStrictEqual({
      url: givenUrl,
      status: 'ARCHIVED',
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
      .send({ query: print(UNDELETE_MUTATION), variables });
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
      .send({ query: print(UNDELETE_MUTATION), variables });
  });
  it('throws NotFound error if the savedItem is not in the user saves (hard-deleted or just nonexistent)', async () => {
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
      .send({ query: print(UNDELETE_MUTATION), variables });
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({
        extensions: { code: 'NOT_FOUND' },
        message: expect.stringContaining('SavedItem does not exist'),
      }),
    );
  });
  // This might change to a true no-op later, but let's stick with current behavior of
  // updatesavedItemUnDelete and have it documented in tests for consistency across clients
  it('does not fail if the SavedItem is not deleted, but updates the timestamp', async () => {
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
      .send({ query: print(UNDELETE_MUTATION), variables });

    expect(res.body.data.savedItemUnDelete).toStrictEqual({
      url: givenUrl,
      status: 'UNREAD',
      _updatedAt: testEpoch,
    });
  });
});
