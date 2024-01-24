import { gql } from 'graphql-tag';
import { readClient, writeClient } from '../../database/client';
import { UserDataService } from '../../dataService/userDataService';
import { startServer } from '../../apollo';
import { print } from 'graphql';
import request from 'supertest';
import { UserFirefoxAccountSeed, UserProfileSeed, UserSeed } from './seeds';

describe('Context manager', () => {
  const readDb = readClient();
  const writeDb = writeClient();
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
  const fetchUserIdSpy = jest.spyOn(UserDataService, 'fromFxaId');

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
    await Promise.all([
      writeDb('user_firefox_account').truncate(),
      writeDb('users').truncate(),
      writeDb('user_profile').truncate(),
    ]);
    await Promise.all([
      writeDb('user_firefox_account').insert(
        UserFirefoxAccountSeed({ user_id: 1, firefox_uid: '123' }),
      ),
      writeDb('users').insert(UserSeed({ user_id: 1 })),
      writeDb('user_profile').insert(
        UserProfileSeed({ user_id: 1, username: 'dracula' }),
      ),
    ]);
  });
  afterEach(() => jest.clearAllMocks());
  afterAll(async () => {
    fetchUserIdSpy.mockRestore();
    await writeDb.destroy();
    await readDb.destroy();
    server.stop();
  });
  it('pulls userId from database if fxaId is passed to request', async () => {
    const res = await request(app)
      .post(url)
      .set({ fxauserid: '123' })
      .send({
        query: print(GET_USER),
      });

    // Check that the method to pull userId from FxaID was called
    expect(fetchUserIdSpy).toHaveBeenCalledTimes(1);
    expect(fetchUserIdSpy.mock.calls[0][1]).toEqual('123');
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
    expect(fetchUserIdSpy).toHaveBeenCalledTimes(0);
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
    expect(fetchUserIdSpy).toHaveBeenCalledTimes(1);
    expect(fetchUserIdSpy.mock.calls[0][1]).toEqual('123');
    expect(res.body.data.errors).toBeUndefined();
    // Can only have retrieved user data if userId was updated on context
    expect(res.body.data?.user.username).toEqual('dracula');
  });

  it('errors if anonymous is passed to context', async () => {
    const res = await request(app)
      .post(url)
      .set({ userid: 'anonymous' })
      .send({
        query: print(GET_USER),
      });

    expect(res.body.data?.user).toBeNull();
    expect(res.body.errors.length).toBe(1);
  });
});
