import { config } from '../config.js';
import nock from 'nock';
import { accountDeleteHandler } from './accountDelete.js';
import { SQSRecord } from 'aws-lambda';

describe('accountDelete handler', () => {
  beforeEach(() => {
    nock(config.endpoint)
      .post(config.queueDeletePath)
      .reply(400, { errors: ['this is an error'] });
  });
  it('throws an error if response is not ok', async () => {
    expect.assertions(2);
    const record = {
      body: JSON.stringify({
        Message: JSON.stringify({
          detail: {
            userId: 1,
            email: '1@2.com',
            isPremium: false,
          },
        }),
      }),
    };
    try {
      await accountDeleteHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('queueDelete - 400');
      expect(e.message).toContain('this is an error');
    }
  });
});
