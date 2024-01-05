import { readClient, writeClient } from '../../../database/client';
import chai, { expect } from 'chai';
import chaiDateTime from 'chai-datetime';
import sinon from 'sinon';
import { EventType } from '../../../businessEvents';
import { getUnixTimestamp } from '../../../utils';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';

chai.use(chaiDateTime);

describe('Update Mutation for SavedItem: ', () => {
  //using write client as mutation will use write client to read as well.
  const writeDb = writeClient();
  const readDb = readClient();
  const eventSpy = sinon.spy(ContextManager.prototype, 'emitItemEvent');
  const date = new Date('2020-10-03 10:20:30'); // Consistent date for seeding
  const date1 = new Date('2020-10-03 10:30:30'); // Consistent date for seeding
  const updateDate = new Date(2021, 1, 1, 0, 0); // mock date for insert
  let clock;
  let app: Express;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const headers = {
    userid: '1',
  };

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    clock.restore();
    sinon.restore();
    await server.stop();
  });

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
    // Mock Date.now() to get a consistent date for inserting data
    clock = sinon.useFakeTimers({
      now: updateDate,
      shouldAdvanceTime: true,
      shouldClearNativeTimers: true,
    });

    await writeDb('list').truncate();
    const inputData = [
      { item_id: 0, status: 0, favorite: 0 },
      { item_id: 1, status: 1, favorite: 0 },
      { item_id: 2, status: 0, favorite: 1 },
      { item_id: 3, status: 0, favorite: 0 },
    ].map((row) => {
      return {
        ...row,
        user_id: 1,
        resolved_id: row.item_id,
        given_url: `http://${row.item_id}`,
        title: `title ${row.item_id}`,
        time_added: date,
        time_updated: date1,
        time_read: date,
        time_favorited: date,
        api_id: 'apiid',
        api_id_updated: 'apiid',
      };
    });
    await writeDb('list').insert(inputData);
  });
  describe('updatedSavedItemArchive', () => {
    const variables = {
      itemId: '0',
    };

    const archiveItemMutation = `
      mutation updateSavedItemArchive($itemId: ID!) {
        updateSavedItemArchive(id: $itemId) {
          archivedAt
          isArchived
          status
          _updatedAt
        }
      }
    `;
    let res: request.Response;

    beforeAll(async () => {
      eventSpy.resetHistory();
      res = await request(app).post(url).set(headers).send({
        query: archiveItemMutation,
        variables,
      });
    });

    it('should archive an item', async () => {
      expect(res.body.errors).to.be.undefined;
      const itemRes = res.body.data?.updateSavedItemArchive;
      expect(itemRes.status).to.equal('ARCHIVED');
      expect(itemRes.isArchived).to.equal(true);
      expect(itemRes._updatedAt)
        .to.equal(itemRes.archivedAt)
        .and.to.equal(getUnixTimestamp(updateDate));
    });
    it('should emit an archive event', async () => {
      expect(eventSpy.calledOnce).to.be.true;
      const eventData = eventSpy.getCall(0).args;
      expect(eventData[0]).to.equal(EventType.ARCHIVE_ITEM);
      expect(eventData[1].id).to.equal(parseInt(variables.itemId));
    });
  });
  describe('updatedSavedItemUnArchive', () => {
    const variables = {
      itemId: '1',
    };

    const unArchiveItemMutation = `
      mutation updateSavedItemUnArchive($itemId: ID!) {
        updateSavedItemUnArchive(id: $itemId) {
          archivedAt
          isArchived
          status
          _updatedAt
        }
      }
    `;
    let res: request.Response;

    beforeAll(async () => {
      eventSpy.resetHistory();
      res = await request(app).post(url).set(headers).send({
        query: unArchiveItemMutation,
        variables,
      });
    });

    it('should unarchive an item', async () => {
      expect(res.body.errors).to.be.undefined;
      const itemRes = res.body.data?.updateSavedItemUnArchive;
      expect(itemRes.status).to.equal('UNREAD');
      expect(itemRes.isArchived).to.equal(false);
      expect(itemRes._updatedAt).to.equal(getUnixTimestamp(updateDate));
      expect(itemRes.archivedAt).to.be.null;
    });
    it('should emit an unarchive event', async () => {
      expect(eventSpy.calledOnce).to.be.true;
      const eventData = eventSpy.getCall(0).args;
      expect(eventData[0]).to.equal(EventType.UNARCHIVE_ITEM);
      expect(eventData[1].id).to.equal(parseInt(variables.itemId));
    });
  });
  describe('updatedSavedItemFavorite', () => {
    let res: request.Response;
    const variables = {
      itemId: '3',
    };

    const savedItemFavoriteMutation = `
      mutation updateSavedItemFavorite($itemId: ID!) {
        updateSavedItemFavorite(id: $itemId) {
          favoritedAt
          isFavorite
          _updatedAt
        }
      }
    `;

    beforeAll(async () => {
      eventSpy.resetHistory();
      res = await request(app).post(url).set(headers).send({
        query: savedItemFavoriteMutation,
        variables,
      });
    });

    it('should favorite an item', async () => {
      expect(res.body.errors).to.be.undefined;
      const itemRes = res.body.data?.updateSavedItemFavorite;
      expect(itemRes.isFavorite).to.equal(true);
      expect(itemRes._updatedAt)
        .to.equal(itemRes.favoritedAt)
        .and.to.equal(getUnixTimestamp(updateDate));
    });
    it('should emit a favorite event', async () => {
      expect(eventSpy.calledOnce).to.be.true;
      const eventData = eventSpy.getCall(0).args;
      expect(eventData[0]).to.equal(EventType.FAVORITE_ITEM);
      expect(eventData[1].id).to.equal(parseInt(variables.itemId));
    });
  });
  describe('updatedSavedItemUnFavorite', () => {
    let res: request.Response;
    const variables = {
      itemId: '2',
    };

    const savedItemUnFavoriteMutation = `
      mutation updateSavedItemUnFavorite($itemId: ID!) {
        updateSavedItemUnFavorite(id: $itemId) {
          favoritedAt
          isFavorite
          _updatedAt
        }
      }
    `;

    beforeAll(async () => {
      eventSpy.resetHistory();
      res = await request(app).post(url).set(headers).send({
        query: savedItemUnFavoriteMutation,
        variables,
      });
    });
    it('should unfavorite an item', async () => {
      expect(res.body.errors).to.be.undefined;
      const itemRes = res.body.data?.updateSavedItemUnFavorite;
      expect(itemRes.isFavorite).to.equal(false);
      expect(itemRes._updatedAt).to.equal(getUnixTimestamp(updateDate));
      expect(itemRes.favoritedAt).to.be.null;
    });

    it('should emit an unfavorite event', async () => {
      expect(eventSpy.calledOnce).to.be.true;
      const eventData = eventSpy.getCall(0).args;
      expect(eventData[0]).to.equal(EventType.UNFAVORITE_ITEM);
      expect(eventData[1].id).to.equal(parseInt(variables.itemId));
    });
  });
});
