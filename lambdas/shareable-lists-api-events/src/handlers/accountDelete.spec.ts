import { config } from '../config';
import nock from 'nock';
import { accountDeleteHandler } from './accountDelete';
import { SQSRecord } from 'aws-lambda';

describe('accountDelete handler', () => {
  const userId = 1234;
  it('throws an error if response is not ok', async () => {
    // mock error response
    nock(config.apiEndpoint)
      .post(config.deleteUserDataPath)
      .reply(400, { errors: ['this is an error'] });

    expect.assertions(2);
    const record = {
      body: JSON.stringify({
        Message: JSON.stringify({
          detail: {
            userId: userId,
          },
        }),
      }),
    };
    try {
      await accountDeleteHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('accountDeleteHandler: 400');
      expect(e.message).toContain('this is an error');
    }
  });
});
