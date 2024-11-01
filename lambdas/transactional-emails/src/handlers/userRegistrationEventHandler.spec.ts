import * as ssm from '../ssm';
import nock, { cleanAll } from 'nock';
import { config } from '../config';
import { SQSRecord } from 'aws-lambda';
import {
  generateUserAliasRequestBody,
  generateUserTrackBody,
  userRegistrationEventHandler,
} from './userRegistrationEventHandler';
import {
  AccountRegistration,
  IncomingBaseEvent,
  PocketEventType,
} from '@pocket-tools/event-bridge';
import { cloneDeep } from 'lodash';

function generateRecord(eventPayload: AccountRegistration) {
  return {
    body: JSON.stringify({
      Message: JSON.stringify({
        ...eventPayload,
        time: '2022-09-10T17:29:22Z',
      }),
    }),
  };
}
describe('user registration event handler', () => {
  const testPayload: AccountRegistration & IncomingBaseEvent = {
    id: '1234567890',
    version: '0',
    account: '123456789012',
    region: 'us-east-2',
    time: new Date(),
    'detail-type': PocketEventType.ACCOUNT_REGISTRATION,
    source: 'web-repo',
    detail: {
      userId: '1',
      email: '1@2.com',
      encodedUserId: '1ab',
      locale: 'en-US',
    },
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
    const result = (await res?.json()) as any;
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
    const result = (await res?.json()) as any;
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
    const errorEvent = cloneDeep(testPayload) as any;
    errorEvent.detail.encodedUserId = undefined;
    const record = generateRecord(errorEvent);

    try {
      await userRegistrationEventHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain(
        "data/detail must have required property 'encodedUserId'",
      );
    }
  });

  describe('generateUserTrackBody', () => {
    it('should return request body', () => {
      const event = cloneDeep(testPayload);
      event.time = new Date('2022-09-10T17:29:22Z');

      const result = generateUserTrackBody(event);
      expect(result).toEqual({
        attributes: [
          {
            external_id: event.detail.encodedUserId,
            email: event.detail.email,
            pocket_locale: event.detail.locale,
            email_subscribe: 'subscribed',
          },
        ],
        events: [
          {
            external_id: event.detail.encodedUserId,
            name: 'user_registration',
            time: new Date('2022-09-10T17:29:22Z').toISOString(),
          },
        ],
      });
    });
    it('should map locale with format fr-ca', () => {
      const event = cloneDeep(testPayload);
      event.time = new Date('2022-09-10T17:29:22Z');
      event.detail.locale = 'fr-ca';
      const result = generateUserTrackBody(event);
      expect(result).toEqual({
        attributes: [
          {
            external_id: event.detail.encodedUserId,
            email: event.detail.email,
            pocket_locale: 'fr-CA',
            email_subscribe: 'subscribed',
          },
        ],
        events: [
          {
            external_id: event.detail.encodedUserId,
            name: 'user_registration',
            time: new Date('2022-09-10T17:29:22Z').toISOString(),
          },
        ],
      });
    });
    it('should map locale with format fr-Ca', () => {
      const event = cloneDeep(testPayload);
      event.time = new Date('2022-09-10T17:29:22Z');
      event.detail.locale = 'fr-CA';
      const result = generateUserTrackBody(event);
      expect(result).toEqual({
        attributes: [
          {
            external_id: event.detail.encodedUserId,
            email: event.detail.email,
            pocket_locale: 'fr-CA',
            email_subscribe: 'subscribed',
          },
        ],
        events: [
          {
            external_id: event.detail.encodedUserId,
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
            external_id: testPayload.detail.encodedUserId,
            alias_name: testPayload.detail.email,
            alias_label: 'email',
          },
        ],
      });
    });
  });
});
