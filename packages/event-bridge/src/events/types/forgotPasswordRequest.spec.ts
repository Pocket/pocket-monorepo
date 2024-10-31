import { SQSRecord } from 'aws-lambda';
import { sqsEventBridgeEvent } from '../../utils';
import { PocketEventType } from '../events';

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
      const event = sqsEventBridgeEvent(recordWithoutEmail as SQSRecord);
      console.log(event);
    } catch (e) {
      expect(e.message).toContain(
        "data/detail/user must have required property 'email'",
      );
    }
  });
});
