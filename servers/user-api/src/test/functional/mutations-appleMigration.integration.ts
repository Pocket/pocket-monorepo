import * as setup from './setup';
import { readClient } from '../../database/client';
import { gql } from 'graphql-tag';
import { PinpointController } from '../../aws/pinpointController';
import sinon from 'sinon';
import { startServer } from '../../apollo';
import request from 'supertest';
import { print } from 'graphql';
import { UserEventEmitter } from '../../events/userEventEmitter';
import config from '../../config';

describe('Apple Migration', () => {
  const db = readClient();
  let server;
  let app;
  let url;
  const userId = '1';
  const fxaId = 'abc123';
  const seedEmail = 'abc@123.com';
  const inputTestEmail = 'def@456.com';
  const appleMigration = gql`
    mutation appleMigration($fxaId: ID!, $email: String!) {
      migrateAppleUser(fxaId: $fxaId, email: $email)
    }
  `;

  const headers = {
    token: 'access_token',
    apiid: '1',
    transfersub: 'test-guid',
  };

  const pinpointStub = sinon.stub(
    PinpointController.prototype,
    'updateUserEndpointEmail',
  );

  const eventEmissionStub = sinon.stub(
    UserEventEmitter.prototype,
    'emitUserEvent',
  );

  afterAll(async () => {
    await db.destroy();
    server.stop();
  });
  beforeAll(async () => {
    ({ app, server, url } = await startServer(config.app.port));
  });

  beforeEach(async () => {
    setup.truncateEmailMutation(db);
    await db('readitla_ril-tmp.apple_migration').truncate();
    await db('readitla_ril-tmp.apple_migration').insert([
      {
        user_id: 1,
        transfer_sub: 'test-guid',
        migrated: 0,
      },
    ]);
    await setup.seedEmailMutation(userId, fxaId, seedEmail, db);
    pinpointStub.resetBehavior();
    pinpointStub.resetHistory();
    eventEmissionStub.resetHistory();
    eventEmissionStub.resetBehavior();
  });

  it('should be able to successfully migrate apple users for a given transferSub', async () => {
    const variables = {
      fxaId: fxaId,
      email: inputTestEmail,
    };
    const res = await request(app)
      .post(url)
      .set({
        ...headers,
      })
      .send({
        query: print(appleMigration),
        variables,
      });
    expect(res.body.data.migrateAppleUser).toEqual('1');
    expect(pinpointStub.callCount).toEqual(1);
    expect(eventEmissionStub.callCount).toEqual(1);
    const emailResult = await db('users').where({ user_id: 1 });
    expect(emailResult[0].email).toEqual(inputTestEmail);
    const firefoxResult = await db('user_firefox_account').where({
      user_id: 1,
    });
    expect(firefoxResult[0].firefox_uid).toEqual(fxaId);
    expect(firefoxResult[0].firefox_email).toEqual(inputTestEmail);
    expect(firefoxResult[0].api_id).toEqual(config.apple_migration_api_id);
    const migrationResult = await db('apple_migration').where({
      user_id: 1,
    });
    expect(migrationResult[0].migrated).toEqual(1);
  });

  it('should be able to create a firefox record if it doesnt already exist', async () => {
    await db('readitla_ril-tmp.user_firefox_account').truncate();
    const variables = {
      fxaId: 'new-fxa-id',
      email: inputTestEmail,
    };
    const res = await request(app)
      .post(url)
      .set({
        ...headers,
      })
      .send({
        query: print(appleMigration),
        variables,
      });
    expect(res.body.data.migrateAppleUser).toEqual('1');
    expect(pinpointStub.callCount).toEqual(1);
    expect(eventEmissionStub.callCount).toEqual(1);
    const emailResult = await db('users').where({ user_id: 1 });
    expect(emailResult[0].email).toEqual(inputTestEmail);
    const firefoxResult = await db('user_firefox_account').where({
      user_id: 1,
    });
    expect(firefoxResult[0].firefox_uid).toEqual('new-fxa-id');
    expect(firefoxResult[0].firefox_email).toEqual(inputTestEmail);
    expect(firefoxResult[0].api_id).toEqual(config.apple_migration_api_id);

    const migrationResult = await db('apple_migration').where({
      user_id: 1,
    });
    expect(migrationResult[0].migrated).toEqual(1);
  });

  it('should throw error for unknown transferSub', async () => {
    const variables = {
      fxaId: fxaId,
      email: inputTestEmail,
    };
    const res = await request(app)
      .post(url)
      .set({
        token: 'access_token',
        apiid: '1',
        transfersub: null,
      })
      .send({
        query: print(appleMigration),
        variables,
      });
    expect(res.body.errors.length).toEqual(1);
    expect(res.body.data).toBeUndefined();
    expect(pinpointStub.callCount).toEqual(0);
    expect(eventEmissionStub.callCount).toEqual(0);
    const result = await db('users').where({ user_id: 1 });
    expect(result[0].email).not.toEqual(inputTestEmail);
    const migrationResult = await db('apple_migration').where({
      user_id: 1,
    });
    expect(migrationResult[0].migrated).toEqual(0);
  });

  it('should fail if email is invalid', async () => {
    const variables = {
      fxaId: fxaId,
      email: 'blah-blah-wrong-data',
    };
    const res = await request(app)
      .post(url)
      .set({
        ...headers,
      })
      .send({
        query: print(appleMigration),
        variables,
      });
    expect(res.body.errors.length).toEqual(1);
    expect(res.body.data).toBeNull();
    expect(pinpointStub.callCount).toEqual(0);
    expect(eventEmissionStub.callCount).toEqual(0);
    const result = await db('users').where({ user_id: 1 });
    expect(result[0].email).not.toEqual(inputTestEmail);
    const migrationResult = await db('apple_migration').where({
      user_id: 1,
    });
    expect(migrationResult[0].migrated).toEqual(0);
  });
});
