import { readClient, writeClient } from '../../database/client';
import { gql } from 'graphql-tag';
import { PinpointController } from '../../aws/pinpointController';
import { userEventEmitter } from '../../events/init';
import { EventType } from '../../events/eventType';
import config from '../../config';
import { startServer } from '../../apollo';
import request from 'supertest';
import { print } from 'graphql';
import { PiiTableSeed, truncatePiiTables } from './seeds';

jest.mock('../../aws/pinpointController');

describe('Delete user mutations', () => {
  const allTables = Object.entries(config.database.userPIITables).flatMap(
    ([_, tables]) => tables,
  );
  const userId = 1;
  const readDb = readClient();
  const writeDb = writeClient();
  let server;
  let app;
  let url;
  let deleteUserEndpointsMock;
  let eventObj = null;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
    await truncatePiiTables();
  });
  afterAll(async () => {
    await readDb.destroy();
    await writeDb.destroy();
    server.stop();
  });
  afterEach(() => jest.clearAllMocks());

  beforeEach(async () => {
    userEventEmitter.on(EventType.ACCOUNT_DELETE, (eventData: any) => {
      eventObj = eventData;
    });

    await writeDb('readitla_auth.users').truncate();
    await writeDb('readitla_auth.user_providers').truncate();
    await PiiTableSeed(userId, '1');

    deleteUserEndpointsMock = PinpointController.prototype.deleteUserEndpoints =
      jest.fn();
  });

  afterEach(async () => {
    eventObj = null;
    await truncatePiiTables();
  });

  describe('deleteUser', () => {
    const allTablesPlusAuth = allTables.concat([
      'readitla_auth.users',
      'readitla_auth.user_providers',
    ]);

    it('should be able to delete historical user', async () => {
      //historical users will not have user profile table
      await writeDb('user_profile').truncate();

      const DELETE_USER = gql`
        mutation deleteUser {
          deleteUser
        }
      `;

      const res = await request(app)
        .post(url)
        .set({
          apiid: '1',
          userid: '1',
        })
        .send({
          query: print(DELETE_USER),
        });

      expect(res.body.data.deleteUser).toBe('1');
      for (const tableName of allTablesPlusAuth) {
        expect((await readDb(tableName).select()).length).toBe(0);
      }
      expect(deleteUserEndpointsMock.mock.calls.length).toBe(1);
      expect(eventObj.user.id).toBe(`1`);
    });

    it('should delete all PII data for user without apple auth', async () => {
      const DELETE_USER = gql`
        mutation deleteUser {
          deleteUser
        }
      `;

      const res = await request(app)
        .post(url)
        .set({
          apiid: '1',
          userid: '1',
        })
        .send({
          query: print(DELETE_USER),
        });

      expect(res.body.data.deleteUser).toBe('1');
      for (const tableName of allTablesPlusAuth) {
        expect((await readDb(tableName).select()).length).toBe(0);
      }
      expect(deleteUserEndpointsMock.mock.calls.length).toBe(1);
      expect(eventObj.user.id).toBe(`1`);
    });

    it('should delete all PII data for user with apple auth', async () => {
      // Set up data
      const authUserId = (await writeDb('readitla_auth.users').insert({}))[0];
      await writeDb('readitla_auth.user_providers').insert({
        user_id: authUserId,
      });
      await writeDb('users')
        .update({ auth_user_id: authUserId })
        .where({ user_id: 1 });

      const DELETE_USER = gql`
        mutation deleteUser {
          deleteUser
        }
      `;

      const res = await request(app)
        .post(url)
        .set({
          token: 'access_token',
          apiid: '1',
          userid: '1',
        })
        .send({
          query: print(DELETE_USER),
        });

      expect(res.body.data.deleteUser).toBe('1');
      for (const tableName of allTablesPlusAuth) {
        expect((await readDb(tableName).select()).length).toBe(0);
      }
      expect(deleteUserEndpointsMock.mock.calls.length).toBe(1);
      expect(eventObj.user.id).toBe(`1`);
    });
  });

  describe('deleteUserByFxaId', () => {
    it('should delete all PII data for user', async () => {
      const variables = {
        fxaId: '1',
      };
      const DELETE_USER = gql`
        mutation deleteUserByFxaId($fxaId: ID!) {
          deleteUserByFxaId(id: $fxaId)
        }
      `;

      const res = await request(app)
        .post(url)
        .set({
          token: 'access_token',
          apiid: '1',
          userid: '1',
          fxaUserId: '1',
        })
        .send({
          query: print(DELETE_USER),
          variables,
        });

      expect(res.body.data.deleteUserByFxaId).toBe('1');
      for (const tableName of allTables) {
        expect((await readDb(tableName).select()).length).toBe(0);
      }
      expect(deleteUserEndpointsMock.mock.calls.length).toBe(1);
      expect(eventObj.user.id).toBe(`1`);
    });

    it('should throw forbidden error for fxaId mismatch', async () => {
      const variables = {
        fxaId: '2',
      };

      const DELETE_USER = gql`
        mutation deleteUserByFxaId($fxaId: ID!) {
          deleteUserByFxaId(id: $fxaId)
        }
      `;

      const res = await request(app)
        .post(url)
        .set({
          token: 'access_token',
          apiid: '1',
          userid: '1',
          fxaUserId: '1',
        })
        .send({
          query: print(DELETE_USER),
          variables,
        });

      expect(res.body.errors[0].message).toBe(
        `FxA user id mismatch in deletion`,
      );
      for (const tableName of allTables) {
        expect((await readDb(tableName).select()).length).toBe(1);
      }
    });
  });
});
