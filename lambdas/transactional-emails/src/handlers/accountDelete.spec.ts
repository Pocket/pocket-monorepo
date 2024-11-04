import nock, { cleanAll } from 'nock';
import { accountDeleteHandler } from './accountDelete';
import { SQSRecord } from 'aws-lambda';
import { config } from '../config';
import * as ssm from '../ssm';
import { sendAccountDeletionEmail } from '../braze';
import { PocketEventType } from '@pocket-tools/event-bridge';

describe('accountDelete handler', () => {
  const record = {
    body: JSON.stringify({
      Message: JSON.stringify({
        id: '1234567890',
        version: '0',
        account: '123456789012',
        region: 'us-east-2',
        time: new Date(),
        'detail-type': PocketEventType.ACCOUNT_DELETION,
        source: 'user-event',
        detail: {
          apiId: '1',
          userId: '1',
          email: '1@2.com',
          isPremium: true,
          timestamp: 123456789,
          version: '1.0.0',
          eventType: 'account-deletion',
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

  it('throw an error if accountDelete event payload is missing email', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.campaignTriggerPath)
      .reply(400, { errors: ['this is an error'] });

    const recordWithoutEmail = {
      body: JSON.stringify({
        Message: JSON.stringify({
          'detail-type': 'account-deletion',
          source: 'user-event',
          detail: {
            apiId: '1',
            userId: '1',
            isPremium: false,
          },
        }),
      }),
    };
    expect.assertions(1); // since it's in a try/catch, make sure we assert
    try {
      await accountDeleteHandler(recordWithoutEmail as SQSRecord);
    } catch (e) {
      expect(e.message).toContain(
        "data/detail must have required property 'email'",
      );
    }
  });

  it('throws an error if email send response is not 200 OK', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.campaignTriggerPath)
      .reply(400, { errors: ['this is an error'] });
    expect.assertions(1); // since it's in a try/catch, make sure we assert
    try {
      await accountDeleteHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('Error 400: Failed to send email');
    }
  });

  it('should retry 3 times if post fails', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.campaignTriggerPath)
      .times(2)
      .reply(500, { errors: ['this is an error'] });

    nock(config.braze.endpoint)
      .post(config.braze.campaignTriggerPath)
      .reply(200, { data: ['this is a data'] });

    const res = await sendAccountDeletionEmail('test@email.com');
    const result = (await res.json()) as any;
    expect(result.data).toEqual(['this is a data']);
  });
});
