import { getUserEventPayload } from './userEventConsumer';
import { UserEventPayloadSnowplow } from '../../snowplow/user/types';

describe('getUserEventPayload', () => {
  it('should convert req body to UserEventPayload', () => {
    const expected: UserEventPayloadSnowplow = {
      user: {
        id: '1',
        email: 'test@gmail.com',
        isPremium: false,
        hashedGuid: 'abcd123',
        hashedId: 'asdasdasdasdasdads',
      },
      apiUser: {
        apiId: '123abc',
      },
      request: {
        language: 'en',
        ipAddress: '127.0.0.1',
      },
      eventType: 'ACCOUNT_DELETE',
    };

    const requestBody = {
      version: '0',
      'detail-type': 'account-deletion',
      source: 'user-events',
      account: '410318598490',
      time: '2022-10-11T02:47:51Z',
      region: 'us-east-1',
      resources: [],
      detail: {
        userId: '1',
        email: 'test@gmail.com',
        apiId: '123abc',
        isPremium: false,
        language: 'en',
        ipAddress: '127.0.0.1',
        hashedGuid: 'abcd123',
        hashedId: 'asdasdasdasdasdads',
      },
    };

    const payload = getUserEventPayload(requestBody);
    expect(payload).toEqual(expected);
  });
});
