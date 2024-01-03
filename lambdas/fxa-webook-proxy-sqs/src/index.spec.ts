import * as fx from './index';
import config from './config';
import nock from 'nock';
import * as jwt from './jwt';
import * as secretManager from './secretManager';
import * as mutations from './mutations';

describe('SQS Event Handler', () => {
  let handleMutationErrorsSpy;

  beforeAll(() => {
    jest.spyOn(secretManager, 'getFxaPrivateKey').mockResolvedValue('fake_key');
    jest.spyOn(jwt, 'generateJwt').mockReturnValue('fake_token');
  });

  afterAll(() => {
    nock.restore();
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // reset the mock before each test so call counts are accurate
    handleMutationErrorsSpy = jest.spyOn(mutations, 'handleMutationErrors');
  });

  afterEach(() => {
    handleMutationErrorsSpy.mockClear();
  });

  describe('checks invalid fxa event', () => {
    it('throws an error if event is missing', async () => {
      const record = {
        user_id: '12345',
        timestamp: 12345,
      };

      await expect(async () => {
        await fx.handlerFn({
          Records: [{ body: JSON.stringify(record) }],
        } as any);
      }).rejects.toThrow('Malformed event');
    });

    it('throws an error if user_id is missing', async () => {
      const record = {
        event: '12345',
        timestamp: 12345,
      };

      await expect(async () => {
        await fx.handlerFn({
          Records: [{ body: JSON.stringify(record) }],
        } as any);
      }).rejects.toThrow('Malformed event');
    });
  });

  describe('UNKNOWN EVENT', () => {
    it('throws no errors for an unknown fxa event', async () => {
      const payload = {
        Records: [
          {
            body: JSON.stringify({
              user_id: '12345',
              event: 'STRANGE_EVENT',
              timestamp: 12345,
              user_email: 'newEmail@example.com',
              transfer_sub: 'test-transfer-sub',
            }),
          },
        ],
      };

      // Casting to any just to not require the unecessary SQS event fields
      await fx.handlerFn(payload as any);

      expect(handleMutationErrorsSpy).toBeCalledTimes(0);
    });
  });

  describe('EVENT.APPLE_MIGRATION', () => {
    it('sends a apple migration event to clientApi', async () => {
      const scope = nock(config.clientApiUri)
        .post('/')
        .reply(200, {
          data: { migrateAppleUser: 'test-pocket-id' },
        });

      const payload = {
        Records: [
          {
            body: JSON.stringify({
              user_id: '12345',
              event: fx.EVENT.APPLE_MIGRATION,
              timestamp: 12345,
              user_email: 'newEmail@example.com',
              transfer_sub: 'test-transfer-sub',
            }),
          },
        ],
      };

      // Casting to any just to not require the unecessary SQS event fields
      await fx.handlerFn(payload as any);

      // Nock marks as done if a request was successfully intercepted
      expect(scope.isDone()).toBeTruthy();

      // potential errors should be handled
      expect(handleMutationErrorsSpy).toBeCalledTimes(1);
    });

    it('throws an error if transfer_sub is missing for apple migration event', async () => {
      const record = {
        user_id: '12345',
        event: fx.EVENT.APPLE_MIGRATION,
        timestamp: 12345,
        user_email: 'example@test.com',
      };

      await expect(async () => {
        await fx.handlerFn({
          Records: [{ body: JSON.stringify(record) }],
        } as any);
      }).rejects.toThrow(
        `Error processing ${JSON.stringify(record)}: missing transfer_sub`
      );

      // should never make it to a client-api request
      expect(handleMutationErrorsSpy).toBeCalledTimes(0);
    });

    it('throws an error if user_email is missing for apple migration event', async () => {
      const record = {
        user_id: '12345',
        event: fx.EVENT.APPLE_MIGRATION,
        timestamp: 12345,
      };

      await expect(async () => {
        await fx.handlerFn({
          Records: [{ body: JSON.stringify(record) }],
        } as any);
      }).rejects.toThrow(
        `Error processing ${JSON.stringify(record)}: missing user_email`
      );

      // should never make it to a client-api request
      expect(handleMutationErrorsSpy).toBeCalledTimes(0);
    });

    it('throws an error if error data is returned from client-api for apple migration event', async () => {
      const replyData = {
        data: null,
        errors: [{ extensions: { code: 'BADREQUEST' } }],
      };
      const scope = nock(config.clientApiUri).post('/').reply(200, replyData);

      const record = {
        user_id: '12345',
        event: fx.EVENT.APPLE_MIGRATION,
        timestamp: 12345,
        user_email: 'example@test.com',
        transfer_sub: 'test-transfer-sub',
      };

      await expect(async () => {
        await fx.handlerFn({
          Records: [{ body: JSON.stringify(record) }],
        } as any);
      }).rejects.toThrow(
        `Error processing ${JSON.stringify(record)}: \n${JSON.stringify(
          replyData.errors
        )}`
      );

      // Nock marks as done if a request was successfully intercepted
      expect(scope.isDone()).toBeTruthy();
    });
  });

  describe('EVENT.PASSWORD_CHANGE', () => {
    it('handles a successful response from client-api', async () => {
      const scope = nock(config.clientApiUri)
        .post('/')
        .reply(200, { data: { expireUserWebSessionTokens: '' } });

      const payload = {
        Records: [
          {
            body: JSON.stringify({
              user_id: '12345',
              event: fx.EVENT.PASSWORD_CHANGE,
              timestamp: 12345,
            }),
          },
        ],
      };

      // Casting to any just to not require the unecessary SQS event fields
      await fx.handlerFn(payload as any);

      // Nock marks as done if a request was successfully intercepted
      expect(scope.isDone()).toBeTruthy();

      // potential errors should be handled
      expect(handleMutationErrorsSpy).toBeCalledTimes(1);
    });

    it('throws an error if error data is returned from client-api when expiring a web session', async () => {
      const replyData = {
        data: null,
        errors: [{ extensions: { code: 'FORBIDDEN' } }],
      };
      const scope = nock(config.clientApiUri).post('/').reply(200, replyData);

      const record = {
        user_id: '12345',
        event: fx.EVENT.PASSWORD_CHANGE,
        timestamp: 12345,
      };

      await expect(async () => {
        await fx.handlerFn({
          Records: [{ body: JSON.stringify(record) }],
        } as any);
      }).rejects.toThrow(
        `Error processing ${JSON.stringify(record)}: \n${JSON.stringify(
          replyData.errors
        )}`
      );

      // Nock marks as done if a request was successfully intercepted
      expect(scope.isDone()).toBeTruthy();

      // potential errors should be handled
      expect(handleMutationErrorsSpy).toBeCalledTimes(1);
    });

    it('returns success if a NotFoundError is returned from client-api when expiring a web session', async () => {
      const replyData = {
        data: null,
        errors: [{ extensions: { code: 'NOT_FOUND' } }],
      };
      const scope = nock(config.clientApiUri).post('/').reply(200, replyData);

      const record = {
        user_id: '12345',
        event: fx.EVENT.PASSWORD_CHANGE,
        timestamp: 12345,
      };

      const res = await fx.handlerFn({
        Records: [{ body: JSON.stringify(record) }],
      } as any);

      expect(res).toStrictEqual({});

      // Nock marks as done if a request was successfully intercepted
      expect(scope.isDone()).toBeTruthy();

      // potential errors should be handled
      expect(handleMutationErrorsSpy).toBeCalledTimes(1);
    });
  });

  describe('EVENT.PROFILE_UPDATE', () => {
    it('sends a profile update - user email updated event to client-api', async () => {
      const scope = nock(config.clientApiUri)
        .post('/')
        .reply(200, {
          data: { updateUserEmailByFxaId: 'newEmail@example.com' },
        });

      const payload = {
        Records: [
          {
            body: JSON.stringify({
              user_id: '12345',
              event: fx.EVENT.PROFILE_UPDATE,
              timestamp: 12345,
              user_email: 'newEmail@example.com',
            }),
          },
        ],
      };

      // Casting to any just to not require the unecessary SQS event fields
      await fx.handlerFn(payload as any);

      // Nock marks as done if a request was successfully intercepted
      expect(scope.isDone()).toBeTruthy();

      // potential errors should be handled
      expect(handleMutationErrorsSpy).toBeCalledTimes(1);
    });

    it('throws an error if error data is returned from client-api for profile update event', async () => {
      const replyData = {
        data: null,
        errors: [{ extensions: { code: 'BADREQUEST' } }],
      };
      const scope = nock(config.clientApiUri).post('/').reply(200, replyData);

      const record = {
        user_id: '12345',
        event: fx.EVENT.PROFILE_UPDATE,
        timestamp: 12345,
        user_email: 'example@test.com',
      };

      await expect(async () => {
        await fx.handlerFn({
          Records: [{ body: JSON.stringify(record) }],
        } as any);
      }).rejects.toThrow(
        `Error processing ${JSON.stringify(record)}: \n${JSON.stringify(
          replyData.errors
        )}`
      );

      // Nock marks as done if a request was successfully intercepted
      expect(scope.isDone()).toBeTruthy();

      // potential errors should be handled
      expect(handleMutationErrorsSpy).toBeCalledTimes(1);
    });

    it('returns success if a NotFoundError is returned from client-api for profile update event', async () => {
      const replyData = {
        data: null,
        errors: [{ extensions: { code: 'NOT_FOUND' } }],
      };
      const scope = nock(config.clientApiUri).post('/').reply(200, replyData);

      const record = {
        user_id: '12345',
        event: fx.EVENT.PROFILE_UPDATE,
        timestamp: 12345,
        user_email: 'example@test.com',
      };

      const res = await fx.handlerFn({
        Records: [{ body: JSON.stringify(record) }],
      } as any);

      expect(res).toStrictEqual({});

      // Nock marks as done if a request was successfully intercepted
      expect(scope.isDone()).toBeTruthy();

      // potential errors should be handled
      expect(handleMutationErrorsSpy).toBeCalledTimes(1);
    });
  });

  describe('EVENT.USER_DELETE', () => {
    it('sends a user delete event to client-api', async () => {
      const scope = nock(config.clientApiUri)
        .post('/')
        .reply(200, { data: { deleteUserByFxaId: '12345' } });

      const payload = {
        Records: [
          {
            body: JSON.stringify({
              user_id: '12345',
              event: fx.EVENT.USER_DELETE,
              timestamp: 12345,
            }),
          },
        ],
      };

      // Casting to any just to not require the unecessary SQS event fields
      await fx.handlerFn(payload as any);

      // Nock marks as done if a request was successfully intercepted
      expect(scope.isDone()).toBeTruthy();

      // potential errors should be handled
      expect(handleMutationErrorsSpy).toBeCalledTimes(1);
    });

    it('throws an error if error data is returned from client-api for user delete event', async () => {
      const replyData = {
        data: null,
        errors: [{ extensions: { code: 'FORBIDDEN' } }],
      };
      const scope = nock(config.clientApiUri).post('/').reply(200, replyData);

      const record = {
        user_id: '12345',
        event: fx.EVENT.USER_DELETE,
        timestamp: 12345,
      };

      await expect(async () => {
        await fx.handlerFn({
          Records: [{ body: JSON.stringify(record) }],
        } as any);
      }).rejects.toThrow(
        `Error processing ${JSON.stringify(record)}: \n${JSON.stringify(
          replyData.errors
        )}`
      );

      // Nock marks as done if a request was successfully intercepted
      expect(scope.isDone()).toBeTruthy();

      // potential errors should be handled
      expect(handleMutationErrorsSpy).toBeCalledTimes(1);
    });

    it('returns success if a NotFoundError is returned from client-api for user delete event', async () => {
      // Temporarily just fix this test data until we use a typed client
      // Pulled from a real log
      const replyData = {
        data: null,
        errors: [
          {
            message: 'Error - Not Found: FxA user not found',
            extensions: {
              code: 'NOT_FOUND',
            },
          },
        ],
      };
      const scope = nock(config.clientApiUri).post('/').reply(200, replyData);

      const record = {
        user_id: '12345',
        event: fx.EVENT.USER_DELETE,
        timestamp: 12345,
      };

      const res = await fx.handlerFn({
        Records: [{ body: JSON.stringify(record) }],
      } as any);

      expect(res).toStrictEqual({});

      // Nock marks as done if a request was successfully intercepted
      expect(scope.isDone()).toBeTruthy();

      // potential errors should be handled
      expect(handleMutationErrorsSpy).toBeCalledTimes(1);
    });
  });
});
