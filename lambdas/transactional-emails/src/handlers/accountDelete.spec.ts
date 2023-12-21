import nock from 'nock';
import { accountDeleteHandler } from './accountDelete';
import { SQSRecord } from 'aws-lambda';
import sinon from 'sinon';
import { config } from '../config';
import * as ssm from '../ssm';
import { sendAccountDeletionEmail } from '../braze';

describe('accountDelete handler', () => {
  const record = {
    body: JSON.stringify({
      Message: JSON.stringify({
        detail: {
          userId: 1,
          email: '1@2.com',
          isPremium: true,
        },
      }),
    }),
  };

  beforeEach(() => {
    sinon.stub(ssm, 'getBrazeApiKey').returns('api-key');
  });

  afterEach(() => {
    nock.cleanAll();
    sinon.restore();
  });

  it('throw an error if accountDelete event payload is missing email', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.campaignTriggerPath)
      .reply(400, { errors: ['this is an error'] });

    const recordWithoutEmail = {
      body: JSON.stringify({
        Message: JSON.stringify({
          detail: {
            userId: 1,
            isPremium: false,
          },
        }),
      }),
    };
    expect.assertions(1); // since it's in a try/catch, make sure we assert
    try {
      await accountDeleteHandler(recordWithoutEmail as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('email is required in event payload');
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
