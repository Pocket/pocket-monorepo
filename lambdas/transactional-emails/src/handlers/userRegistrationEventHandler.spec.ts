import * as ssm from '../ssm';
import nock, { cleanAll } from 'nock';
import { config } from '../config';
import { SQSRecord } from 'aws-lambda';
import { UserRegistrationEvent } from '../schemas/userRegistrationEvent';
import {
  generateUserAliasRequestBody,
  generateUserTrackBody,
  userRegistrationEventHandler,
} from './userRegistrationEventHandler';

function generateRecord(eventPayload: UserRegistrationEvent) {
  return {
    body: JSON.stringify({
      Message: JSON.stringify({
        detail: {
          ...eventPayload,
        },
        time: '2022-09-10T17:29:22Z',
      }),
    }),
  };
}
describe('user registration event handler', () => {
  const testPayload: UserRegistrationEvent = {
    userId: '1',
    email: '1@2.com',
    encodedUserId: '1ab',
    locale: 'en-US',
  };

  const record = generateRecord(testPayload);

  beforeEach(() => {
    jest
      .spyOn(ssm, 'getBrazeApiKey')
      .mockImplementation(() => Promise.resolve('api-key'));
  });

  afterEach(() => {
    cleanAll();
    jest.restoreAllMocks();
  });

  it('should send braze event and not throw error', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.userAliasPath)
      .reply(200, { data: ['this is a alias'] });

    nock(config.braze.endpoint)
      .post(config.braze.setSubscriptionPath)
      .times(1)
      .reply(200, { data: ['this is a subscription'] });

    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .reply(200, { data: ['this is a data'] });

    const res = await userRegistrationEventHandler(record as SQSRecord);
    const result = (await res.json()) as any;
    expect(result.data).toEqual(['this is a data']);
  });

  it('should throw error if user-alias creation failed', async () => {
    //user registration call succeed
    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .reply(200, { data: ['this is a data'] });

    //alias creation failed
    nock(config.braze.endpoint)
      .post(config.braze.userAliasPath)
      .reply(400, { error: ['user-alas creation error'] });

    try {
      await userRegistrationEventHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('Error 400: Failed to create user alias');
    }
  });

  it('should throw error if subscription failed', async () => {
    //user registration call succeed
    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .reply(200, { data: ['this is a data'] });

    //alias successfully created
    nock(config.braze.endpoint)
      .post(config.braze.userAliasPath)
      .reply(200, { data: ['this is a alias'] });

    //user subscription call failed
    nock(config.braze.endpoint)
      .post(config.braze.setSubscriptionPath)
      .reply(400, { error: ['subscription failed'] });

    try {
      await userRegistrationEventHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain(
        `Error 400: Failed to set subscription for id: ${config.braze.marketingSubscriptionId}`,
      );
    }
  });

  it('should return data if retry succeed', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .times(2)
      .reply(500, { errors: ['this is server error'] });

    nock(config.braze.endpoint)
      .post(config.braze.userAliasPath)
      .reply(200, { data: ['this is a alias'] });

    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .reply(200, { data: ['this is a data'] });

    nock(config.braze.endpoint)
      .post(config.braze.setSubscriptionPath)
      .times(1)
      .reply(200, { data: ['this is subscription'] });

    const res = await userRegistrationEventHandler(record as SQSRecord);
    const result = (await res.json()) as any;
    expect(result.data).toEqual(['this is a data']);
  });

  it('should throw server error if all 3 retries fails', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .times(3)
      .reply(500, { errors: ['this is server error'] });

    try {
      await userRegistrationEventHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('Error 500: Failed to create user profile');
    }
  });

  it('should return status and error for braze client error', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .reply(400, { errors: ['this is an error'] });

    try {
      await userRegistrationEventHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('Error 400: Failed to create user profile');
    }
  });

  it('should throw error if one of the payload field is missing', async () => {
    testPayload.encodedUserId = undefined;
    const record = generateRecord(testPayload);

    try {
      await userRegistrationEventHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('encodedUserId does not exist in message');
    }
  });

  describe('generateUserTrackBody', () => {
    it('should return request body', () => {
      const eventDate = '2022-09-10T17:29:22Z';
      const result = generateUserTrackBody(testPayload, eventDate);
      expect(result).toEqual({
        attributes: [
          {
            external_id: testPayload.encodedUserId,
            email: testPayload.email,
            pocket_locale: testPayload.locale,
            email_subscribe: 'subscribed',
          },
        ],
        events: [
          {
            external_id: testPayload.encodedUserId,
            name: 'user_registration',
            time: new Date('2022-09-10T17:29:22Z').toISOString(),
          },
        ],
      });
    });
    it('should map locale with format fr-ca', () => {
      const eventDate = '2022-09-10T17:29:22Z';
      testPayload.locale = 'fr-ca';
      const result = generateUserTrackBody(testPayload, eventDate);
      expect(result).toEqual({
        attributes: [
          {
            external_id: testPayload.encodedUserId,
            email: testPayload.email,
            pocket_locale: 'fr-CA',
            email_subscribe: 'subscribed',
          },
        ],
        events: [
          {
            external_id: testPayload.encodedUserId,
            name: 'user_registration',
            time: new Date('2022-09-10T17:29:22Z').toISOString(),
          },
        ],
      });
    });
    it('should map locale with format fr-Ca', () => {
      const eventDate = '2022-09-10T17:29:22Z';
      testPayload.locale = 'fr-CA';
      const result = generateUserTrackBody(testPayload, eventDate);
      expect(result).toEqual({
        attributes: [
          {
            external_id: testPayload.encodedUserId,
            email: testPayload.email,
            pocket_locale: 'fr-CA',
            email_subscribe: 'subscribed',
          },
        ],
        events: [
          {
            external_id: testPayload.encodedUserId,
            name: 'user_registration',
            time: new Date('2022-09-10T17:29:22Z').toISOString(),
          },
        ],
      });
    });
  });
  describe('generateUserAliasRequestBody', () => {
    it('should return request body', () => {
      const result = generateUserAliasRequestBody(testPayload);
      expect(result).toEqual({
        user_aliases: [
          {
            external_id: testPayload.encodedUserId,
            alias_name: testPayload.email,
            alias_label: 'email',
          },
        ],
      });
    });
  });
});
