import { readClient, writeClient } from '../../../../database/client';
import { EventType } from '../../../../businessEvents';
import { ContextManager } from '../../../../server/context';
import { startServer } from '../../../../server/apollo';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';

describe('Update Mutation for SavedItem: ', () => {
  //using write client as mutation will use write client to read as well.
  const writeDb = writeClient();
  const readDb = readClient();
  const eventSpy = jest.spyOn(ContextManager.prototype, 'emitItemEvent');
  const date = new Date('2020-10-03 10:20:30'); // Consistent date for seeding
  const date1 = new Date('2020-10-03 10:30:30'); // Consistent date for seeding
  const updateDate = new Date(2021, 1, 1, 0, 0); // mock date for insert
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const headers = {
    userid: '1',
  };

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
      advanceTimers: true,
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
      mutation updateSavedItemArchive($itemId: ID!, $timestamp: ISOString) {
        updateSavedItemArchive(id: $itemId, timestamp: $timestamp) {
          archivedAt
          isArchived
          status
          _updatedAt
        }
      }
    `;
    let res: request.Response;

    beforeEach(async () => {
      eventSpy.mockReset();
      res = await request(app).post(url).set(headers).send({
        query: archiveItemMutation,
        variables,
      });
    });

    it('should archive an item', async () => {
      expect(res.body.errors).toBeUndefined();
      const itemRes = res.body.data?.updateSavedItemArchive;
      expect(itemRes.status).toBe('ARCHIVED');
      expect(itemRes.isArchived).toBe(true);
      expect(itemRes._updatedAt).toBe(itemRes.archivedAt);
      expect(new Date(itemRes._updatedAt * 1000)).toBeAfterOrEqualTo(
        updateDate,
      );
    });
    it('should archive an item and set updatedAt to provided timestamp', async () => {
      const timestampedResult = await request(app)
        .post(url)
        .set(headers)
        .send({
          query: archiveItemMutation,
          variables: {
            ...variables,
            timestamp: '2024-03-21T23:35:14.000Z',
          },
        });
      expect(timestampedResult.body.errors).toBeUndefined();
      const itemRes = timestampedResult.body.data?.updateSavedItemArchive;
      expect(itemRes.isArchived).toBe(true);
      expect(itemRes._updatedAt).toEqual(1711064114);
      expect(itemRes.archivedAt).toEqual(1711064114);
    });
    it('should emit an archive event', async () => {
      expect(eventSpy).toHaveBeenCalledTimes(1);
      const eventData = eventSpy.mock.calls[0];
      expect(eventData[0]).toBe(EventType.ARCHIVE_ITEM);
      expect(eventData[1].id).toBe(parseInt(variables.itemId));
    });
  });
  describe('updatedSavedItemUnArchive', () => {
    const variables = {
      itemId: '1',
    };

    const unArchiveItemMutation = `
      mutation updateSavedItemUnArchive($itemId: ID!, $timestamp: ISOString) {
        updateSavedItemUnArchive(id: $itemId, timestamp: $timestamp) {
          archivedAt
          isArchived
          status
          _updatedAt
        }
      }
    `;
    let res: request.Response;

    beforeEach(async () => {
      eventSpy.mockReset();
      res = await request(app).post(url).set(headers).send({
        query: unArchiveItemMutation,
        variables,
      });
    });

    it('should unarchive an item', async () => {
      expect(res.body.errors).toBeUndefined();
      const itemRes = res.body.data?.updateSavedItemUnArchive;
      expect(itemRes.status).toBe('UNREAD');
      expect(itemRes.isArchived).toBe(false);
      expect(new Date(itemRes._updatedAt * 1000)).toBeAfterOrEqualTo(
        updateDate,
      );
      expect(itemRes.archivedAt).toBeNull();
    });
    it('should emit an unarchive event', async () => {
      expect(eventSpy).toHaveBeenCalledTimes(1);
      const eventData = eventSpy.mock.calls[0];
      expect(eventData[0]).toBe(EventType.UNARCHIVE_ITEM);
      expect(eventData[1].id).toBe(parseInt(variables.itemId));
    });
    it('should unarchive an item and set updatedAt to provided timestamp', async () => {
      const timestampedResult = await request(app)
        .post(url)
        .set(headers)
        .send({
          query: unArchiveItemMutation,
          variables: {
            ...variables,
            timestamp: '2024-03-21T23:35:14.000Z',
          },
        });
      expect(timestampedResult.body.errors).toBeUndefined();
      const itemRes = timestampedResult.body.data?.updateSavedItemUnArchive;
      expect(itemRes.isArchived).toBe(false);
      expect(itemRes._updatedAt).toEqual(1711064114);
      expect(itemRes.archivedAt).toBeNull();
    });
  });
  describe('updatedSavedItemFavorite', () => {
    let res: request.Response;
    const variables = {
      itemId: '3',
    };

    const savedItemFavoriteMutation = `
      mutation updateSavedItemFavorite($itemId: ID!, $timestamp: ISOString) {
        updateSavedItemFavorite(id: $itemId, timestamp: $timestamp) {
          favoritedAt
          isFavorite
          _updatedAt
        }
      }
    `;

    beforeEach(async () => {
      eventSpy.mockReset();
      res = await request(app).post(url).set(headers).send({
        query: savedItemFavoriteMutation,
        variables,
      });
    });

    it('should favorite an item', async () => {
      expect(res.body.errors).toBeUndefined();
      const itemRes = res.body.data?.updateSavedItemFavorite;
      expect(itemRes.isFavorite).toBe(true);
      expect(itemRes._updatedAt).toBe(itemRes.favoritedAt);
      expect(new Date(itemRes._updatedAt * 1000)).toBeAfterOrEqualTo(
        updateDate,
      );
    });
    it('should favorite an item and set updatedAt to provided timestamp', async () => {
      const timestampedResult = await request(app)
        .post(url)
        .set(headers)
        .send({
          query: savedItemFavoriteMutation,
          variables: {
            ...variables,
            timestamp: '2024-03-21T23:35:14.000Z',
          },
        });
      expect(timestampedResult.body.errors).toBeUndefined();
      const itemRes = timestampedResult.body.data?.updateSavedItemFavorite;
      expect(itemRes.isFavorite).toBe(true);
      expect(itemRes._updatedAt).toEqual(1711064114);
      expect(itemRes.favoritedAt).toEqual(1711064114);
    });
    it('should emit a favorite event', async () => {
      expect(eventSpy).toHaveBeenCalledTimes(1);
      const eventData = eventSpy.mock.calls[0];
      expect(eventData[0]).toBe(EventType.FAVORITE_ITEM);
      expect(eventData[1].id).toBe(parseInt(variables.itemId));
    });
  });
  describe('updatedSavedItemUnFavorite', () => {
    let res: request.Response;
    const variables = {
      itemId: '2',
    };

    const savedItemUnFavoriteMutation = `
      mutation updateSavedItemUnFavorite($itemId: ID!, $timestamp: ISOString) {
        updateSavedItemUnFavorite(id: $itemId, timestamp: $timestamp) {
          favoritedAt
          isFavorite
          _updatedAt
        }
      }
    `;

    beforeEach(async () => {
      eventSpy.mockReset();
      res = await request(app).post(url).set(headers).send({
        query: savedItemUnFavoriteMutation,
        variables,
      });
    });
    it('should unfavorite an item', async () => {
      expect(res.body.errors).toBeUndefined();
      const itemRes = res.body.data?.updateSavedItemUnFavorite;
      expect(itemRes.isFavorite).toBe(false);
      expect(new Date(itemRes._updatedAt * 1000)).toBeAfterOrEqualTo(
        updateDate,
      );
      expect(itemRes.favoritedAt).toBeNull();
    });
    it('should unfavorite an item and set updatedAt to provided timestamp', async () => {
      const timestampedResult = await request(app)
        .post(url)
        .set(headers)
        .send({
          query: savedItemUnFavoriteMutation,
          variables: { ...variables, timestamp: '2024-03-21T23:35:14.000Z' },
        });
      expect(timestampedResult.body.errors).toBeUndefined();
      const itemRes = timestampedResult.body.data?.updateSavedItemUnFavorite;
      expect(itemRes.isFavorite).toBe(false);
      expect(itemRes._updatedAt).toEqual(1711064114);
      expect(itemRes.favoritedAt).toBeNull();
    });

    it('should emit an unfavorite event', async () => {
      expect(eventSpy).toHaveBeenCalledTimes(1);
      const eventData = eventSpy.mock.calls[0];
      expect(eventData[0]).toBe(EventType.UNFAVORITE_ITEM);
      expect(eventData[1].id).toBe(parseInt(variables.itemId));
    });
  });
});
