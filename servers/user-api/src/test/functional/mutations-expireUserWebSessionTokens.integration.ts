import { readClient } from '../../database/client';
import { ExpireUserWebSessionReason } from '../../types';
import { gql } from 'graphql-tag';
import { expect } from 'chai';
import config from '../../config';
import { startServer } from '../../apollo';
import request from 'supertest';
import { print } from 'graphql';

jest.mock('../../aws/pinpointController');

describe('Expire user web session tokens mutation', () => {
  const db = readClient();
  let server;
  let app;
  let url;

  const headers = {
    fxaUserId: 'abc1234',
    email: 'fake-email-user@gmail.com',
    premium: true,
  };

  const headers2 = {
    fxaUserId: 'abc4321',
    email: 'fake-email-user2@gmail.com',
    premium: false,
  };

  // Tables that need special seeding
  const tablesToExclude = ['user_firefox_account'];

  const allTables = Object.entries(config.database.userPIITables).flatMap(
    ([_, tables]) => tables,
  );

  const EXPIRE_USER_WEB_SESSION = gql`
    mutation Mutation($id: ID!, $reason: ExpireUserWebSessionReason!) {
      expireUserWebSessionByFxaId(id: $id, reason: $reason)
    }
  `;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(config.app.port));
  });
  afterAll(async () => {
    await db.destroy();
    server.stop();
  });
  afterEach(() => jest.clearAllMocks());

  beforeEach(async () => {
    await Promise.all(
      allTables.map((tableName) => {
        return db(tableName).truncate();
      }),
    );
    await db('readitla_ril-tmp.user_web_session_tokens').truncate();
    await db('readitla_ril-tmp.user_firefox_account').truncate();

    await db('readitla_ril-tmp.user_firefox_account').insert([
      {
        user_id: 1234,
        firefox_uid: 'abc1234',
      },
      {
        user_id: 4321,
        firefox_uid: 'abc4321',
      },
    ]);

    await db('readitla_ril-tmp.user_web_session_tokens').insert([
      {
        token_id: 9875362,
        user_id: 1234,
        look_up: 'CA',
      },
    ]);

    await Promise.all(
      Object.entries(config.database.userPIITables).flatMap(([key, tables]) => {
        return tables.map((tableName) => {
          if (tablesToExclude.indexOf(tableName) < 0) {
            return db(tableName).insert({ [key]: 1 });
          }
        });
      }),
    );
  });

  describe('expireUserWebSessionByFxaId', () => {
    it('should throw forbidden error for fxaId mismatch', async () => {
      const variables = {
        id: 'fakeFxaUserId',
        reason: ExpireUserWebSessionReason.PASSWORD_CHANGED,
      };
      const res = await request(app)
        .post(url)
        .set({
          fxaUserId: 'abc1234',
        })
        .send({
          query: print(EXPIRE_USER_WEB_SESSION),
          variables,
        });
      expect(res.body.errors[0].message).equals(
        `FxA user id mismatch in expiring web session tokens`,
      );
    });
    it('should be able to expire web session for user', async () => {
      const variables = {
        id: 'abc1234',
        reason: ExpireUserWebSessionReason.PASSWORD_CHANGED,
      };
      const res = await request(app)
        .post(url)
        .set({
          ...headers,
        })
        .send({
          query: print(EXPIRE_USER_WEB_SESSION),
          variables,
        });
      expect(res.body.data.expireUserWebSessionByFxaId).to.equal('1234');
      // lets make sure status === 0 and time_expired was set
      const dbRes = await db('readitla_ril-tmp.user_web_session_tokens')
        .select('status', 'time_expired')
        .where('user_id', 1234);
      expect(dbRes[0].status).to.equal(0);
      expect(dbRes[0].time_expired).not.to.be.null;
    });
    it('should return success response if fxaId is valid but no entry in web session table for user', async () => {
      const variables = {
        id: 'abc4321',
        reason: ExpireUserWebSessionReason.PASSWORD_CHANGED,
      };
      const res = await request(app)
        .post(url)
        .set({
          ...headers2,
        })
        .send({
          query: print(EXPIRE_USER_WEB_SESSION),
          variables,
        });
      expect(res.body.data.expireUserWebSessionByFxaId).to.equal('4321');
    });
  });
});
