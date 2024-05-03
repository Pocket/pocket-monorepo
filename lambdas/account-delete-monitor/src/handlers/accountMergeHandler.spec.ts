import { client } from '../dynamodb.js';
import { accountMergeHandler } from './accountMergeHandler.js';
import { type SQSRecord } from 'aws-lambda';

describe('Account merge handler', () => {
  beforeAll(() => {
    jest
      .spyOn(client, 'send')
      .mockImplementation(() =>
        Promise.reject(
          new Error('https://www.youtube.com/watch?v=RfiQYRn7fBg'),
        ),
      );
  });
  afterAll(() => jest.restoreAllMocks());
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
      new Error('https://www.youtube.com/watch?v=RfiQYRn7fBg'),
    );
  });
});
