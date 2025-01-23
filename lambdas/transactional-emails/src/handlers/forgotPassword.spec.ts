import nock, { cleanAll } from 'nock';
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { config } from '../config.ts';
import * as ssm from '../ssm.ts';
import { sendForgotPasswordEmail } from '../braze.ts';
import { PocketEventType } from '@pocket-tools/event-bridge';
import { processor } from '../index.ts';
import { serverLogger } from '@pocket-tools/ts-logger';

describe('forgotPassword handler', () => {
  const record = {
    body: JSON.stringify({
      Message: JSON.stringify({
        id: '1234567890',
        version: '0',
        account: '123456789012',
        region: 'us-east-2',
        time: new Date(),
        'detail-type': PocketEventType.FORGOT_PASSWORD,
        source: 'web-repo',
        detail: {
          user: {
            email: '1@2.com',
            encodedId: 'someencodedid',
            id: 1,
          },
          passwordResetInfo: {
            resetPasswordToken: 'atoken',
            resetPasswordUsername: 'billyjoel',
            timestamp: '1/1/1997 5:00pm PT',
          },
        },
      }),
    }),
  };

  let serverLoggerSpy: jest.SpyInstance;

  beforeEach(() => {
    jest
      .spyOn(ssm, 'getBrazeApiKey')
      .mockImplementation(() => Promise.resolve('api-key'));
    serverLoggerSpy = jest.spyOn(serverLogger, 'error');
  });

  afterEach(() => {
    cleanAll();
    jest.restoreAllMocks();
  });

  it('throws an error if email send response is not 200 OK', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.campaignTriggerPath)
      .reply(400, { errors: ['this is an error'] });

    await processor({
      Records: [record] as SQSRecord[],
    } as SQSEvent);

    expect(serverLoggerSpy).toHaveBeenCalledTimes(2);
    expect(serverLoggerSpy.mock.calls[1][0]['errorData']['message']).toContain(
      'Error 400: Failed to send Forgot Password email',
    );
  });

  it('should retry 3 times if post fails', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.campaignTriggerPath)
      .times(2)
      .reply(500, { errors: ['this is an error'] });

    nock(config.braze.endpoint)
      .post(config.braze.campaignTriggerPath)
      .reply(200, { data: ['this is a data'] });

    const res = await sendForgotPasswordEmail({
      encodedId: 'encodedid',
      resetPasswordToken: 'token',
      resetTimeStamp: '5:00pm',
      resetPasswordUsername: 'spongebob',
    });
    const result = (await res.json()) as any;
    expect(result.data).toEqual(['this is a data']);
  });
});
