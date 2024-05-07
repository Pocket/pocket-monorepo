import Client from '../../../../database/client.js';
import { ContextManager } from '../../../../server/context.js';
import { startServer } from '../../../../server/apollo.js';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { getUnixTimestamp } from '../../../../utils.js';
import { jest } from '@jest/globals';

describe('reAddById mutation', () => {
  const writeDb = Client.writeClient();
  const readDb = Client.readClient();
  const eventSpy = jest.spyOn(ContextManager.prototype, 'emitItemEvent');
  const date = new Date('2020-10-03 10:20:30'); // Consistent date for seeding
  const now = Math.round(Date.now() / 1000) * 1000;
  const isoNow = new Date(now).toISOString();
  const headers = { userid: '1' };
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const READD_AN_ITEM = `
        mutation reAdd($id: ID!, $timestamp: ISOString!) {
          reAddById(id: $id, timestamp: $timestamp) {
            id
            isFavorite
            favoritedAt
            _createdAt
            _updatedAt
            _deletedAt
            isArchived
            archivedAt
          }
        }
      `;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
    jest.useFakeTimers({
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
      now,
    });
  });

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    jest.useRealTimers();
    jest.restoreAllMocks();
    await server.stop();
  });

  afterEach(() => eventSpy.mockClear());

  beforeEach(async () => {
    await writeDb('list').truncate();
    const inputData = [
      { item_id: 0, status: 1, favorite: 0 },
      { item_id: 1, status: 2, favorite: 0 },
      { item_id: 2, status: 1, favorite: 1 },
      { item_id: 3, status: 2, favorite: 1 },
    ].map((row) => {
      return {
        ...row,
        user_id: 1,
        resolved_id: row.item_id,
        given_url: `http://${row.item_id}`,
        title: `title ${row.item_id}`,
        time_added: date,
        time_updated: date,
        time_read: row.status === 1 ? date : '0000-00-00 00:00:00',
        time_favorited: row.favorite ? date : '0000-00-00 00:00:00',
        api_id: 'apiid',
        api_id_updated: 'apiid',
      };
    });
    await writeDb('list').insert(inputData);
  });
  it('unarchives an item and resets createdAt', async () => {
    const variables = {
      id: '0',
      timestamp: isoNow,
    };

    const res = await request(app).post(url).set(headers).send({
      query: READD_AN_ITEM,
      variables,
    });
    expect(res).not.toBeNull();
    const data = res.body.data.reAddById;
    const expected = {
      id: '0',
      isArchived: false,
      archivedAt: null,
      _createdAt: now / 1000,
      _updatedAt: now / 1000,
    };
    expect(data).toMatchObject(expected);
    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy.mock.calls[0][0]).toEqual('UNARCHIVE_ITEM');
  });
  it('undeletes an item and resets createdAt', async () => {
    const variables = {
      id: '1',
      timestamp: isoNow,
    };

    const res = await request(app).post(url).set(headers).send({
      query: READD_AN_ITEM,
      variables,
    });
    expect(res).not.toBeNull();
    const data = res.body.data.reAddById;
    const expected = {
      id: '1',
      _deletedAt: null,
      _createdAt: now / 1000,
      _updatedAt: now / 1000,
    };
    expect(data).toMatchObject(expected);
    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy.mock.calls[0][0]).toEqual('ADD_ITEM');
  });
  it.each(['2', '3'])('maintains favorited status', async (id) => {
    const variables = {
      id,
      timestamp: isoNow,
    };

    const res = await request(app).post(url).set(headers).send({
      query: READD_AN_ITEM,
      variables,
    });
    expect(res).not.toBeNull();
    const data = res.body.data.reAddById;
    const expected = {
      id,
      isFavorite: true,
      favoritedAt: getUnixTimestamp(date),
    };
    expect(data).toMatchObject(expected);
  });
  it('returns NotFoundError if itemId does not exist in list', async () => {
    const variables = {
      id: '1231231232323',
      timestamp: isoNow,
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: READD_AN_ITEM, variables });
    expect(res.body.errors).not.toBeNull();
    expect(res.body.errors[0].extensions.code).toEqual('NOT_FOUND');
  });
});
