import { readClient, writeClient } from '../../../database/client';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { mockParserGetItemIdRequest } from '../../utils/parserMocks';

describe('clearTags mutation', () => {
  //using write client as mutation will use write client to read as well.
  const writeDb = writeClient();
  const readDb = readClient();
  const eventSpy = jest.spyOn(ContextManager.prototype, 'emitItemEvent');
  const date = new Date(1711470611 * 1000); // 2024-03-26 16:30:11.000Z
  const now = Math.round(Date.now() / 1000) * 1000;
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const headers = {
    userid: '1',
  };

  const clearTagsMutation = `
      mutation clearTags($saveRef: SavedItemRef!, $timestamp: ISOString) {
        clearTags(savedItem: $saveRef, timestamp: $timestamp) {
          id
          url
          tags {
            name
          }
          _updatedAt
        }
      }
    `;

  beforeAll(async () => {
    jest.useFakeTimers({
      now: now,
      doNotFake: [
        'nextTick',
        'setImmediate',
        'clearImmediate',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
      ],
      advanceTimers: false,
    });
    ({ app, server, url } = await startServer(0));
  });
  beforeEach(async () => {
    // Seed data - with tags (0) and without (1)
    await writeDb('list').truncate();
    const listData = [
      { item_id: 0, status: 0, favorite: 0 },
      { item_id: 1, status: 1, favorite: 0 },
    ].map((row) => {
      return {
        ...row,
        user_id: 1,
        resolved_id: row.item_id,
        given_url: `http://${row.item_id}`,
        title: `title ${row.item_id}`,
        time_added: date,
        time_updated: date,
        time_read: date,
        time_favorited: date,
        api_id: 'apiid',
        api_id_updated: 'apiid',
      };
    });
    await writeDb('list').insert(listData);
    await writeDb('item_tags').truncate();
    const tagData = [
      { item_id: 0, tag: 'simon' },
      { item_id: 0, tag: 'garfunkel' },
    ].map((row) => {
      return {
        ...row,
        user_id: 1,
        status: 1,
        time_added: date,
        time_updated: date,
        api_id: 'apiid',
        api_id_updated: 'updated_api_id',
      };
    });
    await writeDb('item_tags').insert(tagData);
  });
  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    jest.restoreAllMocks();
    jest.useRealTimers();
    await server.stop();
  });
  afterEach(() => eventSpy.mockClear());
  it('clears tags associated to a SavedItem, referenced by ID', async () => {
    const variables = { saveRef: { id: '0' } };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: clearTagsMutation, variables });
    const expected = {
      id: '0',
      tags: [],
      _updatedAt: Math.round(now / 1000),
    };
    expect(res.body.data.clearTags).toMatchObject(expected);
    expect(eventSpy).toHaveBeenCalledOnce();
    expect(eventSpy.mock.calls[0][0]).toEqual('CLEAR_TAGS');
    expect(eventSpy.mock.calls[0][2]).toIncludeSameMembers([
      'garfunkel',
      'simon',
    ]);
  });
  it('clears tags associated to a SavedItem, referenced by url', async () => {
    const givenUrl = 'http://whatever.com';
    mockParserGetItemIdRequest(givenUrl, '0');
    const variables = { saveRef: { url: givenUrl } };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: clearTagsMutation, variables });
    const expected = {
      id: '0',
      tags: [],
      _updatedAt: Math.round(now / 1000),
    };
    expect(res.body.data.clearTags).toMatchObject(expected);
    expect(eventSpy).toHaveBeenCalledOnce();
    expect(eventSpy.mock.calls[0][0]).toEqual('CLEAR_TAGS');
    expect(eventSpy.mock.calls[0][2]).toIncludeSameMembers([
      'garfunkel',
      'simon',
    ]);
  });
  it('accepts a timestamp to clear tags and sets _updatedAt to it', async () => {
    const givenUrl = 'http://whatever.com';
    mockParserGetItemIdRequest(givenUrl, '0');
    const variables = {
      saveRef: { url: givenUrl },
      timestamp: '2024-03-26T16:41:25.000Z',
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: clearTagsMutation, variables });
    const expected = {
      id: '0',
      tags: [],
      _updatedAt: 1711471285,
    };
    expect(res.body.data.clearTags).toMatchObject(expected);
    expect(eventSpy).toHaveBeenCalledOnce();
    expect(eventSpy.mock.calls[0][0]).toEqual('CLEAR_TAGS');
    expect(eventSpy.mock.calls[0][2]).toIncludeSameMembers([
      'garfunkel',
      'simon',
    ]);
  });
  it('throws bad user input error if neither ID nor Url are passed', async () => {
    const variables = { saveRef: {} };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: clearTagsMutation, variables });
    const error = res.body.errors?.[0];
    expect(error).not.toBeUndefined();
    expect(error.message).toContain(
      'SavedItemRef must have one of `id` or `url`',
    );
    expect(error.extensions.code).toEqual('BAD_USER_INPUT');
  });
  it('does not throw error for a SavedItem with no tags, but does not emit event or update timestamp', async () => {
    const variables = { saveRef: { id: '1' } };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: clearTagsMutation, variables });
    const expected = {
      id: '1',
      tags: [],
      _updatedAt: 1711470611,
    };
    expect(res.body.data.clearTags).toMatchObject(expected);
    expect(eventSpy).not.toHaveBeenCalled();
  });
  it('throws error if SavedItem does not exist', async () => {
    const variables = { saveRef: { id: '1233828328328123' } };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: clearTagsMutation, variables });
    const error = res.body.errors?.[0];
    expect(error).not.toBeUndefined();
    expect(error.extensions.code).toEqual('NOT_FOUND');
  });
});
