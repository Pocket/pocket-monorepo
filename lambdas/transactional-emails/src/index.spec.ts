import { cleanAll } from 'nock';
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { PocketEventType } from '@pocket-tools/event-bridge';
import { serverLogger } from '@pocket-tools/ts-logger';
import { processor } from './index.ts';

describe('handler', () => {
  let serverLoggerSpy: jest.SpyInstance;

  beforeEach(() => {
    serverLoggerSpy = jest.spyOn(serverLogger, 'info');
  });

  afterEach(() => {
    cleanAll();
    jest.restoreAllMocks();
  });

  it('should log and skip if a handler is missing', async () => {
    const recordWithoutHandler = {
      body: JSON.stringify({
        Message: JSON.stringify({
          id: '1234567890',
          version: '0',
          account: '123456789012',
          region: 'us-east-2',
          time: new Date(),
          'detail-type': PocketEventType.ACCOUNT_EMAIL_UPDATED,
          source: 'web-repo',
          detail: {
            apiId: '1',
            userId: '1',
            email: '1@2.com',
            isPremium: true,
            timestamp: 123456789,
            version: '1.0.0',
            eventType: PocketEventType.ACCOUNT_EMAIL_UPDATED,
          },
        }),
      }),
    };
    await processor({
      Records: [recordWithoutHandler] as SQSRecord[],
    } as SQSEvent);
    expect(serverLoggerSpy).toHaveBeenCalled();
    expect(serverLoggerSpy.mock.calls[0][0]).toContain('Missing handler');
  });
});
