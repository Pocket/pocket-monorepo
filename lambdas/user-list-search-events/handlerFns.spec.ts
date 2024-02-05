import { config } from './config';
import nock from 'nock';
import { accountDeleteHandler } from './handlerFns';
import { SQSRecord } from 'aws-lambda';

describe('event handler functions', () => {
  describe('accountDelete handler', () => {
    beforeEach(() => {
      nock(config.endpoint)
        .post(config.accountDeletePath)
        .reply(400, { errors: ['this is an error'] });
    });
    it('throws an error if response is not ok', async () => {
      expect.assertions(2);
      const record = {
        body: JSON.stringify({
          Message: JSON.stringify({
            detail: {
              userId: 1,
            },
          }),
        }),
      };
      try {
        await accountDeleteHandler(record as SQSRecord);
      } catch (e) {
        expect(e.message).toContain('batchDelete - 400');
        expect(e.message).toContain('this is an error');
      }
    });
  });
});
