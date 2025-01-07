import { config } from '../../config.ts';
import nock from 'nock';
import { accountDeleteHandler } from './index.ts';
import { callQueueDeleteEndpoint } from './postRequest.ts';
import { SQSRecord } from 'aws-lambda';

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

  afterEach(() => {
    nock.cleanAll();
    jest.restoreAllMocks();
  });

  it('throw an error if accountDelete event payload has undefined fields', async () => {
    nock(config.endpoint)
      .post(config.queueDeletePath)
      .reply(400, { errors: ['this is an error'] });

    const recordWithoutEmail = {
      body: JSON.stringify({
        Message: JSON.stringify({
          detail: {
            email: 'test@test.com',
            isPremium: false,
          },
        }),
      }),
    };
    expect.assertions(1); // since it's in a try/catch, make sure we assert
    try {
      await accountDeleteHandler(recordWithoutEmail as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('userId does not exist in message');
    }
  });
  it('throws an error if queueDelete response is not 200 OK', async () => {
    nock(config.endpoint).post(config.stripeDeletePath).reply(200);
    nock(config.endpoint)
      .post(config.queueDeletePath)
      .reply(400, { errors: ['this is an error'] });
    expect.assertions(3); // since it's in a try/catch, make sure we assert
    try {
      await accountDeleteHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('queueDelete - 400');
      expect(e.message).toContain('this is an error');
      expect(e.errors.length).toEqual(1);
    }
  });

  it('throws an error if stripe response is not 200 ok', async () => {
    nock(config.endpoint)
      .post(config.stripeDeletePath)
      .reply(400, { errors: ['bad call'] });
    nock(config.endpoint).post(config.queueDeletePath).reply(200);
    expect.assertions(3);
    try {
      await accountDeleteHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('stripeDelete - 400');
      expect(e.message).toContain('bad call');
      expect(e.errors.length).toEqual(1);
    }
  });

  it('captures both errors if stripe and queuedelete call fail', async () => {
    nock(config.endpoint)
      .post(config.stripeDeletePath)
      .reply(400, { errors: ['bad call'] });
    nock(config.endpoint)
      .post(config.queueDeletePath)
      .reply(400, { errors: ['this is an error'] });

    expect.assertions(5);
    try {
      await accountDeleteHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('stripeDelete - 400');
      expect(e.message).toContain('bad call');
      expect(e.message).toContain('queueDelete - 400');
      expect(e.message).toContain('this is an error');
      expect(e.errors.length).toEqual(2);
    }
  });

  it('should retry 3 times if post fails', async () => {
    const postBody = {
      userId: '1',
      isPremium: true,
      email: 'test@email.com',
    };
    nock(config.endpoint)
      .post(config.queueDeletePath)
      .times(2)
      .reply(500, { errors: ['this is an error'] });

    nock(config.endpoint)
      .post(config.queueDeletePath)
      .reply(200, { data: ['this is a data'] });

    const res = await callQueueDeleteEndpoint(postBody);
    const result = (await res.json()) as any;
    expect(result.data).toEqual(['this is a data']);
  });
});
