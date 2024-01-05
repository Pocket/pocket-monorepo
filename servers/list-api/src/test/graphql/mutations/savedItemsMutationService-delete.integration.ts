import { readClient, writeClient } from '../../../database/client';
import chai, { expect } from 'chai';
import chaiDateTime from 'chai-datetime';
import sinon from 'sinon';
import { Knex } from 'knex';
import { EventType } from '../../../businessEvents';
import { getUnixTimestamp } from '../../../utils';
import config from '../../../config';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import request from 'supertest';
import { Express } from 'express';
import { ApolloServer } from '@apollo/server';

chai.use(chaiDateTime);

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
  const eventSpy = sinon.spy(ContextManager.prototype, 'emitItemEvent');
  const userId = '1';
  const headers = {
    userid: userId,
  };

  const date = new Date('2020-10-03 10:20:30');
  const updateDate = new Date(2021, 1, 1, 0, 0); // mock date for insert
  let clock;
  let batchDeleteDelay;
  let app: Express;
  let server: ApolloServer<ContextManager>;
  let url: string;

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    clock.restore();
    sinon.restore();
    config.batchDelete.deleteDelayInMilliSec = batchDeleteDelay;
    await server.stop();
  });

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));

    batchDeleteDelay = config.batchDelete.deleteDelayInMilliSec;
    config.batchDelete.deleteDelayInMilliSec = 1;
    // Mock Date.now() to get a consistent date for inserting data
    clock = sinon.useFakeTimers({
      now: updateDate,
      shouldAdvanceTime: false,
      shouldClearNativeTimers: true,
    });
  });

  beforeEach(async () => {
    await writeDb('list').truncate();
    await writeDb('item_tags').truncate();
    await writeDb('item_attribution').truncate();
    await writeDb('items_scroll').truncate();
  });

  afterEach(() => sinon.resetHistory());

  it('should delete a saved item', async () => {
    await setUpSavedItem(writeDb, date);
    const itemId = '1';

    const variables = {
      itemId: itemId,
    };

    const deleteSavedItemMutation = `
      mutation deleteSavedItem($itemId: ID!) {
        deleteSavedItem(id: $itemId)
      }
    `;
    const res = await request(app).post(url).set(headers).send({
      query: deleteSavedItemMutation,
      variables,
    });
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
    const queryVars = {
      userId: userId,
      itemId: itemId,
    };
    const roundtrip = await request(app).post(url).set(headers).send({
      query: querySavedItem,
      variables: queryVars,
    });
    const itemRes = roundtrip.body.data?._entities[0].savedItemById;

    const query = async (tableName) =>
      await readDb(tableName)
        .select()
        .where({ user_id: 1, item_id: 1 })
        .first();

    expect(res.body.errors).to.be.undefined;
    expect(res.body.data?.deleteSavedItem).to.equal('1');
    expect(itemRes.status).to.equal('DELETED');
    expect(itemRes._deletedAt).to.equal(getUnixTimestamp(updateDate));
    expect(await query('item_tags')).to.be.undefined;
    expect(await query('item_attribution')).to.be.undefined;
    expect(await query('items_scroll')).to.be.undefined;
    // Check for delete event
    expect(eventSpy.callCount).to.equal(1);
    const eventData = eventSpy.getCall(0).args;
    expect(eventData[0]).to.equal(EventType.DELETE_ITEM);
    expect(eventData[1].id).to.equal(1);
  });

  it('should undelete a deleted saved item and set status to unread if not previously archived', async () => {
    await upsertSavedItem(writeDb, 2, date);

    const variables = { itemId: '1' };
    const updateSavedItemUnDelete = `
      mutation updateSavedItemUnDelete($itemId: ID!) {
        updateSavedItemUnDelete(id: $itemId) {
          status
          _updatedAt
        }
      }
    `;
    const res = await request(app).post(url).set(headers).send({
      query: updateSavedItemUnDelete,
      variables,
    });

    expect(res.body.errors).to.be.undefined;
    const itemRes = res.body.data?.updateSavedItemUnDelete;
    expect(itemRes.status).to.equal('UNREAD');
    expect(itemRes._updatedAt).to.equal(getUnixTimestamp(updateDate));
  });

  it('should undelete a deleted saved item and set status to archived if previously archived', async () => {
    await upsertSavedItem(writeDb, 2, date, true);

    const variables = { itemId: '1' };
    const updateSavedItemUnDelete = `
      mutation updateSavedItemUnDelete($itemId: ID!) {
        updateSavedItemUnDelete(id: $itemId) {
          status
          _updatedAt
        }
      }
    `;
    const res = await request(app).post(url).set(headers).send({
      query: updateSavedItemUnDelete,
      variables,
    });

    expect(res.body.errors).to.be.undefined;
    const itemRes = res.body.data?.updateSavedItemUnDelete;
    expect(itemRes.status).to.equal('ARCHIVED');
    expect(itemRes._updatedAt).to.equal(getUnixTimestamp(updateDate));
  });
});
