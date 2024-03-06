import nock, { cleanAll } from 'nock';
import { SQSRecord } from 'aws-lambda';
import { config } from '../config';
import * as ssm from '../ssm';
// import { sendForgotPasswordEmail } from '../braze';
import { forgotPasswordHandler } from './forgotPassword';

describe('forgotPassword handler', () => {
  const record = {
    body: JSON.stringify({
      Message: JSON.stringify({
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

  beforeEach(() => {
    jest
      .spyOn(ssm, 'getBrazeApiKey')
      .mockImplementation(() => Promise.resolve('api-key'));
  });

  afterEach(() => {
    cleanAll();
    jest.restoreAllMocks();
  });

  it('throw an error if forgotPassword event payload is missing email', async () => {
    const recordWithoutEmail = {
      body: JSON.stringify({
        Message: JSON.stringify({
          detail: {
            user: {
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
    expect.assertions(1); // since it's in a try/catch, make sure we assert
    try {
      await forgotPasswordHandler(recordWithoutEmail as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('email is required in event payload');
    }
  });

  it.skip('throws an error if email send response is not 200 OK', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.campaignTriggerPath)
      .reply(400, { errors: ['this is an error'] });
    expect.assertions(1); // since it's in a try/catch, make sure we assert
    try {
      await forgotPasswordHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('Error 400: Failed to send email');
    }
  });

  it.skip('should retry 3 times if post fails', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.campaignTriggerPath)
      .times(2)
      .reply(500, { errors: ['this is an error'] });

    nock(config.braze.endpoint)
      .post(config.braze.campaignTriggerPath)
      .reply(200, { data: ['this is a data'] });

    // const res = await sendForgotPasswordEmail({
    //   email: 'test@email.com',
    //   resetPasswordToken: 'token',
    //   resetTimeStamp: '5:00pm',
    //   resetPasswordUsername: 'spongebob',
    // });
    // const result = (await res.json()) as any;
    // expect(result.data).toEqual(['this is a data']);
  });
});
