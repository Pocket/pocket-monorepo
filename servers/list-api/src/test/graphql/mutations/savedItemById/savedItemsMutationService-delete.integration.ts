import { readClient, writeClient } from '../../../../database/client';
import { Knex } from 'knex';
import { EventType } from '../../../../businessEvents';
import { ContextManager } from '../../../../server/context';
import { startServer } from '../../../../server/apollo';
import request from 'supertest';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';

async function upsertSavedItem(
  db: Knex,
  status: number,
  date: Date,
  archived = false,
) {
  await db('list').insert([
    {
      item_id: 1,
      status: status,
      favorite: 0,
      user_id: 1,
      resolved_id: 1,
      given_url: 'https://1.test',
      title: 'title 1',
      time_added: date,
      time_updated: date,
      time_read: archived ? date : '0000-00-00 00:00:00',
      time_favorited: date,
      api_id: 'apiid',
      api_id_updated: 'apiid',
    },
    {
      item_id: 2,
      status: status,
      favorite: 0,
      user_id: 1,
      resolved_id: 1,
      given_url: 'https://1.test',
      title: 'title 2',
      time_added: date,
      time_updated: date,
      time_read: archived ? date : '0000-00-00 00:00:00',
      time_favorited: date,
      api_id: 'apiid',
      api_id_updated: 'apiid',
    },
  ]);
}

async function setUpSavedItem(db: Knex, date: Date) {
  await upsertSavedItem(db, 0, date);
  await db('item_tags').insert([
    {
      user_id: 1,
      item_id: 1,
      tag: 'zebra',
      time_added: date,
      time_updated: date,
    },
    {
      user_id: 1,
      item_id: 1,
      tag: 'travel',
      time_added: date,
      time_updated: date,
    },
    {
      user_id: 1,
      item_id: 2,
      tag: 'snow',
      time_added: date,
      time_updated: date,
    },
  ]);
  await db('item_attribution').insert([
    {
      user_id: 1,
      item_id: 1,
      attribution_type_id: 101,
    },
    {
      user_id: 1,
      item_id: 2,
      attribution_type_id: 101,
    },
  ]);
  await db('items_scroll').insert({
    user_id: 1,
    item_id: 1,
    view: 1,
    section: 0,
    page: 1,
    node_index: 10,
    scroll_percent: 10,
    time_updated: date,
    updated_at: date,
  });
}

describe('Delete/Undelete SavedItem: ', () => {
  //using write client as mutation will use write client to read as well.
  const writeDb = writeClient();
  const readDb = readClient();
  const eventSpy = jest.spyOn(ContextManager.prototype, 'emitItemEvent');
  const userId = '1';
  const headers = {
    userid: userId,
  };

  const date = new Date('2020-10-03 10:20:30');
  const updateDate = new Date(2021, 1, 1, 0, 0); // mock date for insert
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    jest.useRealTimers();
    jest.restoreAllMocks();
    await server.stop();
  });

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));

    // Mock Date.now() to get a consistent date for inserting data
    jest.useFakeTimers({
      now: updateDate,
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
  });

  beforeEach(async () => {
    await writeDb('list').truncate();
    await writeDb('item_tags').truncate();
    await writeDb('item_attribution').truncate();
    await writeDb('items_scroll').truncate();
  });

  afterEach(() => jest.clearAllMocks());

  describe('delete', () => {
    const deleteSavedItemMutation = `
      mutation deleteSavedItem($itemId: ID!, $timestamp: ISOString) {
        deleteSavedItem(id: $itemId, timestamp: $timestamp)
      }
    `;
    const querySavedItem = `
      query getSavedItem($userId: ID!, $itemId: ID!) {
        _entities(representations: { id: $userId, __typename: "User" }) {
          ... on User {
            savedItemById(id: $itemId) {
              status
              _deletedAt
            }
          }
        }
      }
    `;
    beforeEach(async () => await setUpSavedItem(writeDb, date));
    it('should delete a saved item', async () => {
      const itemId = '1';
      const variables = {
        itemId: itemId,
      };
      const res = await request(app).post(url).set(headers).send({
        query: deleteSavedItemMutation,
        variables,
      });
      const roundtrip = await request(app).post(url).set(headers).send({
        query: querySavedItem,
        variables: { userId, itemId },
      });
      const itemRes = roundtrip.body.data?._entities[0].savedItemById;

      const query = async (tableName) =>
        await readDb(tableName)
          .select()
          .where({ user_id: 1, item_id: 1 })
          .first();

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data?.deleteSavedItem).toBe('1');
      expect(itemRes.status).toBe('DELETED');
      expect(new Date(itemRes._deletedAt * 1000)).toBeAfterOrEqualTo(
        updateDate,
      );
      expect(await query('item_tags')).toBeUndefined();
      expect(await query('item_attribution')).toBeUndefined();
      expect(await query('items_scroll')).toBeUndefined();
      // Check for delete event
      expect(eventSpy).toHaveBeenCalledTimes(1);
      const eventData = eventSpy.mock.calls[0];
      expect(eventData[0]).toBe(EventType.DELETE_ITEM);
      expect(eventData[1].id).toBe(1);
    });
    it('should set _deletedAt to be the given timestamp if provided', async () => {
      const itemId = '1';
      const variables = {
        itemId: itemId,
        timestamp: '2024-03-21T23:35:14.000Z',
      };
      await request(app).post(url).set(headers).send({
        query: deleteSavedItemMutation,
        variables,
      });
      const roundtrip = await request(app).post(url).set(headers).send({
        query: querySavedItem,
        variables: { userId, itemId },
      });
      const itemRes = roundtrip.body.data?._entities[0].savedItemById;
      expect(itemRes.status).toBe('DELETED');
      expect(itemRes._deletedAt).toEqual(1711064114);
    });
  });

  describe('undelete', () => {
    const updateSavedItemUnDelete = `
      mutation updateSavedItemUnDelete($itemId: ID!, $timestamp: ISOString) {
        updateSavedItemUnDelete(id: $itemId, timestamp: $timestamp) {
          status
          _updatedAt
        }
      }
    `;
    it('should undelete a deleted saved item and set status to unread if not previously archived', async () => {
      await upsertSavedItem(writeDb, 2, date);
      const res = await request(app)
        .post(url)
        .set(headers)
        .send({
          query: updateSavedItemUnDelete,
          variables: { itemId: '1' },
        });

      expect(res.body.errors).toBeUndefined();
      const itemRes = res.body.data?.updateSavedItemUnDelete;
      expect(itemRes.status).toBe('UNREAD');
      expect(new Date(itemRes._updatedAt * 1000)).toBeAfterOrEqualTo(
        updateDate,
      );
    });
    it('should set _updatedAt to the given timestamp if provided', async () => {
      await upsertSavedItem(writeDb, 2, date);
      const res = await request(app)
        .post(url)
        .set(headers)
        .send({
          query: updateSavedItemUnDelete,
          variables: { itemId: '1', timestamp: '2024-03-21T23:35:14.000Z' },
        });
      expect(res.body.errors).toBeUndefined();
      const itemRes = res.body.data?.updateSavedItemUnDelete;
      expect(itemRes._updatedAt).toEqual(1711064114);
    });

    it('should undelete a deleted saved item and set status to archived if previously archived', async () => {
      await upsertSavedItem(writeDb, 2, date, true);
      const res = await request(app)
        .post(url)
        .set(headers)
        .send({
          query: updateSavedItemUnDelete,
          variables: { itemId: '1' },
        });
      expect(res.body.errors).toBeUndefined();
      const itemRes = res.body.data?.updateSavedItemUnDelete;
      expect(itemRes.status).toBe('ARCHIVED');
      expect(new Date(itemRes._updatedAt * 1000)).toBeAfterOrEqualTo(
        updateDate,
      );
    });
  });
});
