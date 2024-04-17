import { readClient, writeClient } from '../../../../database/client';
import { ContextManager } from '../../../../server/context';
import { startServer } from '../../../../server/apollo';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';

describe('removeTagsByName mutation', () => {
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

  const removeTagsMutation = `
      mutation removeTagsByName($saveRef: SavedItemRef!, $tagNames: [String!]!, $timestamp: ISOString) {
        removeTagsByName(savedItem: $saveRef, tagNames: $tagNames, timestamp: $timestamp) {
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
      { item_id: 0, tag: 'ketheric' },
      { item_id: 0, tag: 'gortash' },
      { item_id: 1, tag: 'ketheric' },
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
  afterEach(() => eventSpy.mockClear());
  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    jest.restoreAllMocks();
    jest.useRealTimers();
    await server.stop();
  });
  it('should remove existing tags from all associated items', async () => {
    const variables = {
      saveRef: { id: '0' },
      tagNames: ['ketheric', 'gortash'],
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: removeTagsMutation, variables });
    const expected = {
      _updatedAt: now / 1000,
      id: '0',
      tags: [],
    };
    expect(res.body.data.removeTagsByName).toMatchObject(expected);
    expect(eventSpy).toHaveBeenCalledOnce();
    expect(eventSpy.mock.calls[0][0]).toEqual('REMOVE_TAGS');
    expect(eventSpy.mock.calls[0][2]).toIncludeSameMembers([
      'ketheric',
      'gortash',
    ]);
  });
  it('accepts a timestamp to delete tags and sets _updatedAt to it for associated Saves', async () => {
    const timestamp = '2024-03-26T16:41:25.000Z';
    const variables = {
      saveRef: { id: '0' },
      tagNames: ['ketheric'],
      timestamp,
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: removeTagsMutation, variables });
    const expected = {
      _updatedAt: new Date(timestamp).getTime() / 1000,
      id: '0',
      tags: [{ name: 'gortash' }],
    };
    expect(res.body.data.removeTagsByName).toMatchObject(expected);
    expect(eventSpy).toHaveBeenCalledOnce();
    expect(eventSpy.mock.calls[0][0]).toEqual('REMOVE_TAGS');
    expect(eventSpy.mock.calls[0][2]).toIncludeSameMembers(['ketheric']);
  });
  it('remove tags that do exist when passed an array containing tags that do not', async () => {
    const variables = { saveRef: { id: '1' }, tagNames: ['orin', 'ketheric'] };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: removeTagsMutation, variables });
    const expected = {
      id: '1',
      tags: [],
    };
    expect(res.body.data.removeTagsByName).toMatchObject(expected);
    // The event still contains both tags requested to remove, since we don't
    // check before attempting to delete (it just is a no-op if doesn't exist)
    expect(eventSpy).toHaveBeenCalledOnce();
    expect(eventSpy.mock.calls[0][0]).toEqual('REMOVE_TAGS');
    expect(eventSpy.mock.calls[0][2]).toIncludeSameMembers([
      'orin',
      'ketheric',
    ]);
  });
  it('throws error if SavedItem does not exist', async () => {
    const variables = {
      saveRef: { id: '1233828328328123' },
      tagNames: ['orin', 'ketheric', 'gortash'],
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: removeTagsMutation, variables });
    const error = res.body.errors?.[0];
    expect(error).not.toBeUndefined();
    expect(error.extensions.code).toEqual('NOT_FOUND');
  });
});
