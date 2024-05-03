import { readClient, writeClient } from '../../../../database/client.js';
import { ContextManager } from '../../../../server/context.js';
import { startServer } from '../../../../server/apollo.js';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';

describe('deleteTagByName mutation', () => {
  //using write client as mutation will use write client to read as well.
  const writeDb = writeClient();
  const readDb = readClient();
  const tagQueryStub = readDb('item_tags').count().first();
  const listUpdatedStub = readDb('list')
    .select()
    .andWhere('user_id', '1')
    .pluck('time_updated');
  const date = new Date(1711470611 * 1000); // 2024-03-26 16:30:11.000Z
  const now = Math.round(Date.now() / 1000) * 1000;
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const headers = {
    userid: '1',
  };

  const deleteTagMutation = `
      mutation deleteTagByName($tagName: String!, $timestamp: ISOString) {
        deleteTagByName(tagName: $tagName, timestamp: $timestamp)
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
  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    jest.restoreAllMocks();
    jest.useRealTimers();
    await server.stop();
  });
  it('should completely remove an existing tag from all associated items', async () => {
    const variables = { tagName: 'ketheric' };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: deleteTagMutation, variables });
    const expectedDate = new Date(now);
    expect(res.body.data.deleteTagByName).toEqual('ketheric');
    const kethericCount = (await tagQueryStub.where('tag', 'ketheric'))[
      'count(*)'
    ];
    expect(kethericCount).toEqual(0);
    const updatedTimes = await listUpdatedStub.whereIn('item_id', ['0', '1']);
    expect(updatedTimes).toEqual([expectedDate, expectedDate]);
  });
  it('accepts a timestamp to delete tags and sets _updatedAt to it for associated Saves', async () => {
    const timestamp = '2024-03-26T16:41:25.000Z';
    const variables = {
      tagName: 'ketheric',
      timestamp,
    };
    const expectedDate = new Date(timestamp);
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: deleteTagMutation, variables });
    expect(res.body.data.deleteTagByName).toEqual('ketheric');
    const kethericCount = (await tagQueryStub.where('tag', 'ketheric'))[
      'count(*)'
    ];
    expect(kethericCount).toEqual(0);
    const updatedTimes = await listUpdatedStub.whereIn('item_id', ['0', '1']);
    expect(updatedTimes).toEqual([expectedDate, expectedDate]);
  });
  it('do nothing if the tag does not exist, and not throw error', async () => {
    const variables = { tagName: 'orin' };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: deleteTagMutation, variables });
    const expected = 'orin';
    expect(res.body.data.deleteTagByName).toEqual(expected);
  });
});
