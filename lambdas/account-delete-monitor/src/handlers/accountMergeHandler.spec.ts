import sinon from 'sinon';
import { client } from '../dynamodb';
import { accountMergeHandler } from './accountMergeHandler';
import { SQSRecord } from 'aws-lambda';

describe('Account merge handler', () => {
  beforeAll(() => {
    sinon
      .stub(client, 'send')
      .rejects(new Error('https://www.youtube.com/watch?v=RfiQYRn7fBg'));
  });
  afterAll(() => sinon.restore());
  it('throws an error if dynamo call throws error', async () => {
    const record = {
      body: JSON.stringify({
        Message: JSON.stringify({
          detail: {
            sourceUserId: '123',
            destinationUserId: '456',
          },
        }),
      }),
    } as SQSRecord;
    await expect(accountMergeHandler(record)).rejects.toEqual(
      new Error('https://www.youtube.com/watch?v=RfiQYRn7fBg')
    );
  });
});
