import { gql } from 'graphql-tag';
import { readClient } from '../../database/client';
import sinon from 'sinon';
import { UserDataService } from '../../dataService/userDataService';
import { startServer } from '../../apollo';
import { print } from 'graphql';
import request from 'supertest';
import config from '../../config';

describe('Context manager', () => {
  const db = readClient();
  let server;
  let app;
  let url;
  const GET_USER = gql`
    query user {
      user {
        username
      }
    }
  `;
  const fetchUserIdSpy = sinon.spy(UserDataService, 'fromFxaId');

  beforeAll(async () => {
    ({ app, server, url } = await startServer(config.app.port));
    await Promise.all([
      db('user_firefox_account').truncate(),
      db('users').truncate(),
      db('user_profile').truncate(),
    ]);
    await Promise.all([
      db('user_firefox_account').insert({ user_id: '1', firefox_uid: '123' }),
      db('users').insert({ user_id: '1' }),
      db('user_profile').insert({ user_id: 1, username: 'dracula' }),
    ]);
    afterEach(() => fetchUserIdSpy.resetHistory());
    afterAll(() => {
      fetchUserIdSpy.restore();
      server.stop();
    });
  });
  it('pulls userId from database if fxaId is passed to request', async () => {
    const res = await request(app)
      .post(url)
      .set({ fxauserid: '123' })
      .send({
        query: print(GET_USER),
      });

    // Check that the method to pull userId from FxaID was called
    expect(fetchUserIdSpy.callCount).toEqual(1);
    expect(fetchUserIdSpy.getCall(0).args[1]).toEqual('123');
    // Can only have retrieved user data if userId was added to context
    expect(res.body.data?.user.username).toEqual('dracula');
  });
  it('does not pull userId if userId is passed to request', async () => {
    const res = await request(app)
      .post(url)
      .set({ userid: '1' })
      .send({
        query: print(GET_USER),
      });

    // Check that the method to pull userId from FxaID was not called
    expect(fetchUserIdSpy.callCount).toEqual(0);
    expect(res.body.data?.user.username).toEqual('dracula');
  });
  it('(legacy) resets userId if both fxaId and userId are passed to request', async () => {
    const res = await request(app)
      .post(url)
      .set({ fxauserid: '123', userid: '999' })
      .send({
        query: print(GET_USER),
      });

    // Check that the method to pull userId from FxaID was called
    expect(fetchUserIdSpy.callCount).toEqual(1);
    expect(fetchUserIdSpy.getCall(0).args[1]).toEqual('123');
    expect(res.body.data.errors).toBeFalsy();
    // Can only have retrieved user data if userId was updated on context
    expect(res.body.data?.user.username).toEqual('dracula');
  });
});
