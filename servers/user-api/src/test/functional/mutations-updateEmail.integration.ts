import * as setup from './setup';
import { readClient } from '../../database/client';
import { gql } from 'graphql-tag';
import IntMask from '../../utils/intMask';
import { PinpointController } from '../../aws/pinpointController';
import sinon from 'sinon';
import { UserDataService } from '../../dataService/userDataService';
import { startServer } from '../../apollo';
import request from 'supertest';
import { print } from 'graphql';
import * as utils from '../../utils/email';
import config from '../../config';

describe('updateUserEmailByFxaId Mutation test', () => {
  const db = readClient();
  let server;
  let app;
  let url;

  const req = {
    headers: { token: 'access_token', apiid: '1', fxauserid: 'abc123' },
  };
  afterAll(async () => {
    await db.destroy();
    server.stop();
  });
  beforeAll(async () => {
    ({ app, server, url } = await startServer(config.app.port));
  });

  describe('updateEmailByFxAId', () => {
    const userId = '1';
    const fxaId = 'abc123';
    const seedEmail = 'abc@123.com';
    const email = 'def@456.com';
    const updateEmailByFxaId = gql`
      mutation updateUserEmailByFxaId($id: ID!, $email: String!) {
        updateUserEmailByFxaId(id: $id, email: $email) {
          id
          username
        }
      }
    `;
    const pinpointStub = sinon.stub(
      PinpointController.prototype,
      'updateUserEndpointEmail',
    );
    const updateEmailSpy = sinon.spy(
      UserDataService.prototype,
      'updateUserEmail',
    );
    beforeAll(async () => {
      await setup.truncateEmailMutation(db);
    });
    beforeEach(async () => {
      await setup.seedEmailMutation(userId, fxaId, seedEmail, db);
      pinpointStub.resetBehavior();
      pinpointStub.resetHistory();
      updateEmailSpy.resetHistory();
    });
    afterEach(async () => {
      await setup.truncateEmailMutation(db);
    });
    it('should successfully update db and pinpoint', async () => {
      const variables = { id: fxaId, email: email };
      const result = await request(app)
        .post(url)
        .set(req.headers)
        .send({
          query: print(updateEmailByFxaId),
          variables,
        });

      expect(result.body.errors).toBeUndefined();
      expect(result.body.data?.updateUserEmailByFxaId.id).toEqual(
        IntMask.encode(userId),
      );
      expect(result.body.data?.updateUserEmailByFxaId.username).toEqual(
        'chicory',
      );
      // Email is updated in a transaction, so if this succeeds them they all did
      expect(
        (await db('users').where('user_id', userId).first()).email,
      ).toEqual('def@456.com');
      expect(pinpointStub.callCount).toEqual(1);
    });
    it('should fail if email is invalid', async () => {
      const variables = { id: fxaId, email: 'lala' };
      const result = await request(app)
        .post(url)
        .set(req.headers)
        .send({
          query: print(updateEmailByFxaId),
          variables,
        });

      expect(result.body.errors.length).toEqual(1);
      expect(result.body.errors[0].message).toEqual(
        'Bad email address provided for update: lala',
      );
      expect(result.body.errors[0].extensions.code).toEqual('BAD_USER_INPUT');
      expect(result.body.data).toBeNull();
      expect(pinpointStub.callCount).toEqual(0);
      expect(updateEmailSpy.callCount).toEqual(0);
    });

    it('should fail if UserId does not exist for given FxA id', async () => {
      await db('user_firefox_account').where('user_id', userId).del();
      const variables = { id: fxaId, email: email };

      const result = await request(app)
        .post(url)
        .set(req.headers)
        .send({
          query: print(updateEmailByFxaId),
          variables,
        });

      expect(result.body.errors[0].extensions.code).toEqual('NOT_FOUND');
      expect(pinpointStub.callCount).toEqual(0);
      expect(updateEmailSpy.callCount).toEqual(0);
    });
    it('should not update db if Pinpoint call fails', async () => {
      pinpointStub.rejects();
      const variables = { id: fxaId, email: email };
      const result = await request(app)
        .post(url)
        .set(req.headers)
        .send({
          query: print(updateEmailByFxaId),
          variables,
        });
      expect(result.body.errors.length).toEqual(1);
      expect(result.body.data).toBeNull();
      expect(pinpointStub.callCount).toEqual(1);
      expect(updateEmailSpy.callCount).toEqual(0);
    });
    it('should rollback DB', async () => {
      const contactHashStub = sinon.stub(utils, 'contactHash').throws();
      const variables = { id: fxaId, email: email };
      await request(app)
        .post(url)
        .set(req.headers)
        .send({
          query: print(updateEmailByFxaId),
          variables,
        });
      // Blank email will fail when computing hashed contact,
      // but need to override validation
      expect(contactHashStub.callCount).toEqual(1);
      expect(updateEmailSpy.callCount).toEqual(1);
      // Email is updated in a transaction, so if this failed to set them they all did
      expect(
        (await db('users').where('user_id', userId).first()).email,
      ).toEqual(seedEmail);
      contactHashStub.restore();
    });
  });
});
