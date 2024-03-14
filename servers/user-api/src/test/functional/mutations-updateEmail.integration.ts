import * as setup from './setup';
import { readClient, writeClient } from '../../database/client';
import { gql } from 'graphql-tag';
import { IntMask } from '@pocket-tools/int-mask';
import { UserDataService } from '../../dataService/userDataService';
import { startServer } from '../../apollo';
import request from 'supertest';
import { print } from 'graphql';
import * as utils from '../../utils/email';
import { IContext } from '../../context';
import { ApolloServer } from '@apollo/server';
import { EventType } from '../../events/eventType';
import { userEventEmitter } from '../../events/init';
import { Application } from 'express';
import config from '../../config';

describe('updateUserEmailByFxaId Mutation test', () => {
  const readDb = readClient();
  const writeDb = writeClient();
  let server: ApolloServer<IContext>;
  let app: Application;
  let url: string;
  let eventObj = null;

  const req = {
    headers: { token: 'access_token', apiid: '1', fxauserid: 'abc123' },
  };
  afterAll(async () => {
    server.stop();
    await readDb.destroy();
    await writeDb.destroy();
  });
  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    userEventEmitter.on(EventType.ACCOUNT_EMAIL_UPDATED, (eventData: any) => {
      eventObj = eventData;
    });
  });

  afterEach(async () => {
    eventObj = null;
  });

  describe('updateEmailByFxAId', () => {
    const userId = 1;
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
    const updateEmailSpy: jest.SpyInstance = jest.spyOn(
      UserDataService.prototype,
      'updateUserEmail',
    );
    const contactHashStub: jest.SpyInstance = jest.spyOn(utils, 'contactHash');
    beforeAll(async () => {
      await setup.truncateEmailMutation(writeDb);
    });
    beforeEach(async () => {
      await setup.seedEmailMutation(userId, fxaId, seedEmail, writeDb);
    });
    afterEach(async () => {
      await setup.truncateEmailMutation(writeDb);
    });
    it('should successfully update db', async () => {
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
        IntMask.encode(userId, config.secrets.intMask),
      );
      expect(result.body.data?.updateUserEmailByFxaId.username).toEqual(
        'chicory',
      );
      // Email is updated in a transaction, so if this succeeds them they all did
      expect(
        (await readDb('users').where('user_id', userId).first()).email,
      ).toEqual('def@456.com');
      expect(eventObj.user.hashedId).toBe(
        `fX792e6e9163ec630a71a9X08497c36eT3e25a4cd0ba5b1056fv989d5`,
      );
      expect(eventObj.user.email).toBe(`def@456.com`);
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
      // expect(result.body.errors[0].message).toEqual(
      //   'Bad email address provided for update: lala',
      // );
      // expect(result.body.errors[0].extensions.code).toEqual('BAD_USER_INPUT');
      expect(result.body.data).toBeNull();
      expect(updateEmailSpy).toHaveBeenCalledTimes(0);
    });

    it('should fail if UserId does not exist for given FxA id', async () => {
      await writeDb('user_firefox_account').where('user_id', userId).del();
      const variables = { id: fxaId, email: email };

      await request(app)
        .post(url)
        .set(req.headers)
        .send({
          query: print(updateEmailByFxaId),
          variables,
        });

      // expect(result.body.errors[0].extensions.code).toEqual('NOT_FOUND');
      expect(updateEmailSpy).toHaveBeenCalledTimes(0);
    });
    it('should rollback DB', async () => {
      contactHashStub.mockImplementation(
        (contact: string, contactType: number) => {
          console.log('asd');
          throw new Error();
        },
      );
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
      expect(contactHashStub).toHaveBeenCalledTimes(1);
      expect(updateEmailSpy).toHaveBeenCalledTimes(1);
      // Email is updated in a transaction, so if this failed to set them they all did
      expect(
        (await readDb('users').where('user_id', userId).first()).email,
      ).toEqual(seedEmail);
    });
  });
});
