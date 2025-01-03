import * as fx from './index.ts';
import config from './config.ts';
import nock from 'nock';
import * as secretManager from './secretManager.ts';
import * as mutations from './mutations.ts';

describe('SQS Event Handler', () => {
  let handleMutationErrorsSpy;

  beforeAll(() => {
    jest.spyOn(secretManager, 'getFxaPrivateKey').mockResolvedValue({
      p: '2NE9Yskv7kZaM_OMvKElEWRKi6peRae3JkMp-TvjqMIO69kV3zQfpb0gfIdcC54_BuGUUUjL9IEDApWas-IBbG33bKoGTzCzNbfML0aQvAHpuvZI6pGAq3OdHgC-kGjb5wyK3tDaP-rS8aVYjrB9jQY7Go-F4xWyikNm-99BJg0',
      kty: 'RSA',
      q: 't8a8oOBF-MGnIuQBYlMzUa0YdpnQY2zLOfkocEoRbUNtaUZW-UEwaqy2q9rbQksM6j9LVY8jAzb0YvAag8TorCZlbhvmlZONqq5I_Reto1FPRNXLGJjHVMTonLRboCiSm_EFisZHPvgqAxln00MNAqRQnUnbP5CbCY4RrdNXjTU',
      d: 'h5bNYEjOE7wRUms-2mawI6MEqy5F1GmT8uZeVzEeGxfBHmPk2zVipN_YrmbNxCfyxKX_kbY2NbwcCBhUUs7_-v0D5JtJrr2fPEOQAi6snaHal264h5xXv6_Z_nQOYkEp8OYreNWrt9heG2DGPhNlHBEn-yVxcEw9KFl4ABwQhFdzf2PuyTytITlLjqrUWTYDciH3LJSnRyFiO45mii3RvJFmcivSFyyXiH-IFGC60ZyWYswHE8ITD9tENUX5vC-PTLMN71AIaXoGRNHaFHfsJmxbtwPBXkSShk5CRc-YqVNQvDX35KFFx0qnPd5ARWPi9iTzbP4Zyx3eoN37G8eTUQ',
      e: 'AQAB',
      use: 'sig',
      kid: 'helloworld',
      qi: 'PJ5W_ANyXuLmsMuCDPlhF8q3G490j3VbxqwjRPKeboxCinAskm7VnQJjZJPBw0_A565YJeEOWjbfauBax-4YaHmOK6wYd1sfTXSq6r5id58fWMmSu8ToZe8sziN5R9kvmrIKrddnS5NtvDQIaZJRUpbfMEzN8JouC--Oylzfwrs',
      dp: 'uamznzwYxzmHVKViBsUXMOVo0GB7iboso58v-jTGpmRG0r96cz_3Ob3Sa9CdiXVhE0tn7pMf06gGI9hoOVF3Vpp0HaEa9gUF8SIKvxD2L4iT1X3Awt0GCcte56pLhO3GIPwkjtjZi5JSQIsOYmHPoUuMoRn11Jdn4-4D6fsrlqE',
      alg: 'RS256',
      dq: 'HG5vokfwK1LyY5B4sliC2QD5hue2-JrNOhPU8MJUvd2voJjUPc2bCvXbcOzz_OaVgev24K67UPUAjAnvYDFnebKbAJTqcHuacCx0eEtgfqLGq7STriN8ux2Xix7QChAc1mlMXTLdtN05yq70hBecfKslGaBifgwGIE1NaOIIan0',
      n: 'm6XkeQIGIK44RK44g__-UwzW2cApDNy1H2dCnisrYmJj8QuyEBcFQs9y8PZtYTV3u1fm9awVs-E_SNqy62I6IaTaDwABetjQSNV1-q0NgwpBjcvwldNc2gyt9NNvxE5Yto5RKolZejkAU4GcPgNXah3fgoGZ59IJLVLDl9y9dnYtQwhHZ08k0RqsWTtQTUU9DFN6N7c9d0mOMCet8HbvcTYpT7zcRjAwplpvmo2TAN3iiNRlalyGrxNx2NECewsrDz7oiCutppWUWSa0oIJc0xRGegx4zOMEyPd72Z2Q6-JcxCKjcAIRknOhGyp3pMZZT3lTuoSYK0kbDDFlv90JsQ',
    });
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
        `Error processing ${JSON.stringify(record)}: missing transfer_sub`,
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
        `Error processing ${JSON.stringify(record)}: missing user_email`,
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
          replyData.errors,
        )}`,
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
          replyData.errors,
        )}`,
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
          replyData.errors,
        )}`,
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
          replyData.errors,
        )}`,
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
