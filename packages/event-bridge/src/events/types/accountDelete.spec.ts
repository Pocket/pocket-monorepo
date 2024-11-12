import { SQSRecord } from 'aws-lambda';
import { sqsLambdaEventBridgeEvent } from '../../utils';
import { PocketEventType } from '../events';
import { AccountDelete } from './account';

describe('account delete event', () => {
  it('throw an error if account delete event payload is missing email', async () => {
    const recordWithoutEmail = {
      body: JSON.stringify({
        Message: JSON.stringify({
          account: '12345',
          id: '12345',
          region: 'us-west-2',
          time: '2021-08-12T20:05:00Z',
          version: '1.0',
          source: 'user-event',
          'detail-type': PocketEventType.ACCOUNT_DELETION,
          detail: {
            userId: 1,
            isPremium: false,
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
        "data/detail must have required property 'email'",
      );
    }
  });

  it('coerces numbers to bools', async () => {
    const recordWithNumberBool = {
      body: JSON.stringify({
        Message: JSON.stringify({
          account: '12345',
          id: '12345',
          region: 'us-west-2',
          time: '2021-08-12T20:05:00Z',
          version: '1.0',
          source: 'user-event',
          'detail-type': PocketEventType.ACCOUNT_DELETION,
          detail: {
            apiId: '1',
            userId: 1,
            email: 'asd@me.com',
            version: '1.0.0',
            timestamp: 123456789,
            eventType: PocketEventType.ACCOUNT_DELETION,
            isPremium: 0,
          },
        }),
      }),
    };
    const event: AccountDelete = sqsLambdaEventBridgeEvent(
      recordWithNumberBool as SQSRecord,
    ) as AccountDelete;
    expect(event.detail.isPremium).toBe(false);
  });
});
