import { accountDeleteHandler } from './accountDeleteHandler';
import { SQSRecord } from 'aws-lambda';
import { client, dynamo } from '../dynamodb';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../config';
import * as deleteMutation from '../externalCaller/deleteMutation';
import sinon from 'sinon';
import { truncateTable } from '../test/utils';

describe('Account delete handler', () => {
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
      SentTimestamp: '-2291068800000',
    },
  } as SQSRecord;

  beforeEach(async () => {
    await truncateTable(config.trackingTable.name, dynamo);
  });

  it('puts request record into DynamoDB', async () => {
    const expectedItem = {
      id: '123_request',
      email: 'jonathan.harker@exeter.to',
      date: '1897-05-26',
      timestamp: '1897-05-26T00:00:00.000Z',
    };
    await accountDeleteHandler(record);
    const res = await client.send(
      new GetCommand({
        TableName: config.trackingTable.name,
        Key: { id: '123_request' },
      })
    );
    expect(res.Item).toEqual(expectedItem);
  });

  it('should trigger deleteMutation for old records', async () => {
    const userApiCaller = sinon
      .stub(deleteMutation, 'deleteUserMutationCaller')
      .resolves();

    //seed old accounts
    await client.send(
      new PutCommand({
        TableName: config.trackingTable.name,
        Item: {
          id: '123_merged',
          sourceIds: new Set(['100', '50']),
        },
      })
    );

    await accountDeleteHandler(record);

    const calls = userApiCaller.getCalls();
    expect(calls[0].args[0]).toEqual('100');
    expect(calls[1].args[0]).toEqual('50');
  });
});
