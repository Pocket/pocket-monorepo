import { SQSRecord } from 'aws-lambda';
import { client, dynamo } from '../dynamodb.js';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../config.js';
import { accountMergeHandler } from './accountMergeHandler.js';
import { truncateTable } from '../test/utils.js';

describe('Account merge handler', () => {
  beforeEach(async () => {
    await truncateTable(config.trackingTable.name, dynamo);
  });
  it('adds a new merged account record', async () => {
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

    const expectedItem = {
      id: '456_merged',
      sourceIds: new Set(['123']),
    };
    await accountMergeHandler(record);
    const res = await client.send(
      new GetCommand({
        TableName: config.trackingTable.name,
        Key: { id: '456_merged' },
      }),
    );
    expect(res.Item).toEqual(expectedItem);
  });
  it('Appends another account to the list of source accounts', async () => {
    const expectedItem = {
      id: '456_merged',
      sourceIds: new Set(['123', '789']),
    };
    const record = {
      body: JSON.stringify({
        Message: JSON.stringify({
          detail: {
            sourceUserId: '789',
            destinationUserId: '456',
          },
        }),
      }),
    } as SQSRecord;
    expect.assertions(1);
    // Seed data
    await client.send(
      new PutCommand({
        TableName: config.trackingTable.name,
        Item: {
          id: '456_merged',
          sourceIds: new Set(['123']),
        },
      }),
    );
    await accountMergeHandler(record);
    // Roundtrip
    const res = await client.send(
      new GetCommand({
        TableName: config.trackingTable.name,
        Key: { id: '456_merged' },
      }),
    );
    expect(res.Item).toEqual(expectedItem);
  });
});
