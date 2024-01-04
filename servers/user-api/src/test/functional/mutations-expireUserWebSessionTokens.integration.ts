import { readClient, writeClient } from '../../database/client';
import { ExpireUserWebSessionReason } from '../../types';
import { gql } from 'graphql-tag';
import { startServer } from '../../apollo';
import request from 'supertest';
import { print } from 'graphql';
import { UserFirefoxAccountSeed } from './seeds';

jest.mock('../../aws/pinpointController');

describe('Expire user web session tokens mutation', () => {
  const readDb = readClient();
  const writeDb = writeClient();
  let server;
  let app;
  let url;

  const headers = {
    fxaUserId: 'abc1234',
    email: 'fake-email-user@gmail.com',
    premium: 'true',
  };

  const headers2 = {
    fxaUserId: 'abc4321',
    email: 'fake-email-user2@gmail.com',
    premium: 'false',
  };

  const EXPIRE_USER_WEB_SESSION = gql`
    mutation Mutation($id: ID!, $reason: ExpireUserWebSessionReason!) {
      expireUserWebSessionByFxaId(id: $id, reason: $reason)
    }
  `;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
  });
  afterAll(async () => {
    await readDb.destroy();
    await writeDb.destroy();
    server.stop();
  });
  afterEach(() => jest.clearAllMocks());

  beforeEach(async () => {
    await writeDb('readitla_ril-tmp.user_web_session_tokens').truncate();
    await writeDb('readitla_ril-tmp.user_firefox_account').truncate();

    await writeDb('readitla_ril-tmp.user_firefox_account').insert(
      [
        {
          user_id: 1234,
          firefox_uid: 'abc1234',
        },
        {
          user_id: 4321,
          firefox_uid: 'abc4321',
        },
      ].map((input) => UserFirefoxAccountSeed(input)),
    );

    await writeDb('readitla_ril-tmp.user_web_session_tokens').insert([
      {
        token_id: 9875362,
        user_id: 1234,
        look_up: 'CA',
      },
    ]);
  });

  describe('expireUserWebSessionByFxaId', () => {
    it('should throw forbidden error for fxaId mismatch', async () => {
      const variables = {
        id: 'fakeFxaUserId',
        reason: ExpireUserWebSessionReason.PASSWORD_CHANGED,
      };
      await request(app)
        .post(url)
        .set({
          fxaUserId: 'abc1234',
        })
        .send({
          query: print(EXPIRE_USER_WEB_SESSION),
          variables,
        });
      // expect(res.body.errors[0].message).toBe(
      //   `FxA user id mismatch in expiring web session tokens`,
      // );
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
      expect(res.body.data.expireUserWebSessionByFxaId).toBe('1234');
      // lets make sure status === 0 and time_expired was set
      const dbRes = await readDb('readitla_ril-tmp.user_web_session_tokens')
        .select('status', 'time_expired')
        .where('user_id', 1234);
      expect(dbRes[0].status).toBe(0);
      expect(dbRes[0].time_expired).not.toBeNull();
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
      expect(res.body.data.expireUserWebSessionByFxaId).toBe('4321');
    });
  });
});
