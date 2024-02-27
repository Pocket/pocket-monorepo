import { config } from '../config';
import nock from 'nock';
import { processBody } from './itemDelete';

import { SQSRecord } from 'aws-lambda';
import { UserItemsSqsMessage } from '../types';

describe('userItem Delete functions', () => {
  it('throws an error if response is not ok', async () => {
    nock(config.search.endpoint)
      .post(config.search.itemDelete)
      .reply(400, { errors: ['this is an error'] });
    expect.assertions(2);

    const body: UserItemsSqsMessage = {
      userItems: [{ itemIds: [1, 2, 3], userId: 2 }],
    };

    const record = {
      body: JSON.stringify(body),
    };
    try {
      await processBody(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('userItemDelete - 400');
      expect(e.message).toContain('this is an error');
    }
  });

  it('passes if response is ok', async () => {
    nock(config.search.endpoint).post(config.search.itemDelete).reply(200);

    const body: UserItemsSqsMessage = {
      userItems: [{ itemIds: [1, 2, 3], userId: 2 }],
    };

    const record = {
      body: JSON.stringify(body),
    };
    await processBody(record as SQSRecord);
  });
});
