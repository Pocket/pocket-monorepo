import { SQSRecord } from 'aws-lambda';
import { sqsLambdaEventBridgeEvent } from '../../utils.ts';
import { PocketEventType } from '../events.ts';
import { ForgotPasswordRequest } from './forgotPasswordRequest.ts';
import { IncomingBaseEvent } from './base.ts';

describe('forgotPasswordRequest event', () => {
  it('throw an error if forgotPassword event payload is missing email', async () => {
    const recordWithoutEmail = {
      body: JSON.stringify({
        Message: JSON.stringify({
          account: '12345',
          id: '12345',
          region: 'us-west-2',
          time: '2021-08-12T20:05:00Z',
          version: '1.0',
          source: 'web-repo',
          'detail-type': PocketEventType.FORGOT_PASSWORD,
          detail: {
            user: {
              encodedId: 'someencodedid',
              id: 1,
            },
            passwordResetInfo: {
              resetPasswordToken: 'atoken',
              resetPasswordUsername: 'billyjoel',
              timestamp: 12312312333,
            },
          },
        }),
      }),
    };
    expect.assertions(1); // since it's in a try/catch, make sure we assert
    try {
      const event = sqsLambdaEventBridgeEvent(recordWithoutEmail as SQSRecord);
      console.log(event);
    } catch (e) {
      expect(e.message).toContain(
        "data/detail/user must have required property 'email'",
      );
    }
  });

  it('coerces strings to numbers', async () => {
    const recordWithBadTypes = {
      body: JSON.stringify({
        Message: JSON.stringify({
          account: '12345',
          id: '12345',
          region: 'us-west-2',
          time: '2021-08-12T20:05:00Z',
          version: '1.0',
          source: 'web-repo',
          'detail-type': PocketEventType.FORGOT_PASSWORD,
          detail: {
            user: {
              encodedId: 'someencodedid',
              email: 'asd@me.com',
              id: '1',
            },
            passwordResetInfo: {
              resetPasswordToken: 'atoken',
              resetPasswordUsername: 'billyjoel',
              timestamp: '12312312333',
            },
          },
        }),
      }),
    };
    const event = sqsLambdaEventBridgeEvent(recordWithBadTypes as SQSRecord);
    expect(event?.['detail-type']).toBe(PocketEventType.FORGOT_PASSWORD);
    const castEvent = event as ForgotPasswordRequest;
    expect(castEvent.detail.user.id).toBe(1);
  });

  it('coerces time field to a date', async () => {
    const recordWithBadTypes = {
      body: JSON.stringify({
        Message: JSON.stringify({
          account: '12345',
          id: '12345',
          region: 'us-west-2',
          time: '2021-08-12T20:05:00Z',
          version: '1.0',
          source: 'web-repo',
          'detail-type': PocketEventType.FORGOT_PASSWORD,
          detail: {
            user: {
              encodedId: 'someencodedid',
              email: 'asd@me.com',
              id: 1,
            },
            passwordResetInfo: {
              resetPasswordToken: 'atoken',
              resetPasswordUsername: 'billyjoel',
              timestamp: '12312312333',
            },
          },
        }),
      }),
    };
    const event = sqsLambdaEventBridgeEvent(recordWithBadTypes as SQSRecord);
    expect(event?.['detail-type']).toBe(PocketEventType.FORGOT_PASSWORD);
    const castEvent = event as ForgotPasswordRequest & IncomingBaseEvent;
    expect(castEvent.time.getTime()).toBe(1628798700000);
  });
});
