import { config } from './config/index.js';
import nock from 'nock';
import { processUserImport, processUserItem } from './helper.js';

import { UserItemsSqsMessage, UserListImportSqsMessage } from './types.js';

describe('Item functions', () => {
  describe('itemDelete', () => {
    const endpoint = config.search.endpoint + config.search.itemDelete;
    it('throws an error if response is not ok', async () => {
      nock(config.search.endpoint)
        .post(config.search.itemDelete)
        .reply(400, { errors: ['this is an error'] });
      expect.assertions(2);

      const body: UserItemsSqsMessage = {
        userItems: [{ itemIds: [1, 2, 3], userId: 2 }],
      };

      try {
        await processUserItem(body, endpoint);
      } catch (e) {
        expect(e.message).toContain('400');
        expect(e.message).toContain('this is an error');
      }
    });

    it('passes if response is ok', async () => {
      nock(config.search.endpoint).post(config.search.itemDelete).reply(200);

      const body: UserItemsSqsMessage = {
        userItems: [{ itemIds: [1, 2, 3], userId: 2 }],
      };

      await processUserItem(body, endpoint);
    });
  });

  describe('itemUpdate', () => {
    const endpoint = config.search.endpoint + config.search.itemUpdate;
    it('throws an error if response is not ok', async () => {
      nock(config.search.endpoint)
        .post(config.search.itemUpdate)
        .reply(400, { errors: ['this is an error'] });
      expect.assertions(2);

      const body: UserItemsSqsMessage = {
        userItems: [{ itemIds: [1, 2, 3], userId: 2 }],
      };

      try {
        await processUserItem(body, endpoint);
      } catch (e) {
        expect(e.message).toContain('400');
        expect(e.message).toContain('this is an error');
      }
    });

    it('passes if response is ok', async () => {
      nock(config.search.endpoint).post(config.search.itemUpdate).reply(200);

      const body: UserItemsSqsMessage = {
        userItems: [{ itemIds: [1, 2, 3], userId: 2 }],
      };

      await processUserItem(body, endpoint);
    });
  });

  describe('userListImport', () => {
    const endpoint = config.search.endpoint + config.search.userListImport;
    it('throws an error if response is not ok', async () => {
      nock(config.search.endpoint)
        .post(config.search.userListImport)
        .reply(400, { errors: ['this is an error'] });
      expect.assertions(2);

      const body: UserItemsSqsMessage = {
        userItems: [{ itemIds: [1, 2, 3], userId: 2 }],
      };

      try {
        await processUserItem(body, endpoint);
      } catch (e) {
        expect(e.message).toContain('400');
        expect(e.message).toContain('this is an error');
      }
    });

    it('passes if response is ok', async () => {
      nock(config.search.endpoint)
        .post(config.search.userListImport)
        .reply(200);

      const body: UserListImportSqsMessage = {
        users: [{ userId: 2 }],
      };

      await processUserImport(body, endpoint);
    });
  });
});
