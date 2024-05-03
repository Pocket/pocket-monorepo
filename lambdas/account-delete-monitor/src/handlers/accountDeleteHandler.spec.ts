import { client } from '../dynamodb.js';
import { accountDeleteHandler } from './accountDeleteHandler.js';
import { type SQSRecord } from 'aws-lambda';

describe('Account delete handler', () => {
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
            userId: '123',
            email: 'jonathan.harker@exeter.to',
            isPremium: 'false',
          },
        }),
      }),
      attributes: {
        SentTimestamp: '-2291068800',
      },
    } as SQSRecord;
    await expect(accountDeleteHandler(record)).rejects.toEqual(
      new Error('https://www.youtube.com/watch?v=RfiQYRn7fBg'),
    );
  });
});
