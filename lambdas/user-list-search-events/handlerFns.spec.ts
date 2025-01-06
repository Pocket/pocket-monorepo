import { config } from './config.ts';
import nock from 'nock';
import { SQSRecord } from 'aws-lambda';
import { __handler } from './index.ts';
import { serverLogger } from '@pocket-tools/ts-logger';
import { PocketEventType } from '@pocket-tools/event-bridge';

describe('event handler functions', () => {
  describe('accountDelete handler', () => {
    let serverLoggerSpy: jest.SpyInstance;
    beforeEach(() => {
      serverLoggerSpy = jest.spyOn(serverLogger, 'error');
      nock(config.endpoint)
        .post(config.accountDeletePath)
        .reply(400, { errors: ['this is an error'] });
    });
    it('throws an error if response is not ok', async () => {
      const record = {
        body: JSON.stringify({
          Message: JSON.stringify({
            'detail-type': PocketEventType.ACCOUNT_DELETION,
            source: 'user-event',
            account: '123456789012',
            id: '1234567890',
            region: 'us-east-2',
            time: '2022-09-10T17:29:22Z',
            version: '0',
            detail: {
              eventType: 'account-deletion',
              version: '12',
              timestamp: 123456789,
              userId: 1,
              email: 'test@me.com',
              apiId: '1',
              isPremium: 'true',
            },
          }),
        }),
      };
      expect.assertions(4);

      try {
        await __handler({ Records: [record] as SQSRecord[] });
      } catch (e) {
        expect(e.message).toContain('batchDelete - 400');
        expect(e.message).toContain('this is an error');
      }
      expect(nock.isDone()).toBeTruthy();
      expect(serverLoggerSpy).toHaveBeenCalledTimes(1);
    });
  });
});
