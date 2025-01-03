import { SQSRecord } from 'aws-lambda';
import { client } from '../dynamodb.ts';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../config.ts';
// import { expirationTimestamp } from '../utils';
import { UserMergeEvent } from '../types.ts';

/**
 * Store records to identify history of merged accounts.
 * @param record event containing the source and destination
 * userIds for the merged accounts
 */
export async function accountMergeHandler(record: SQSRecord) {
  const { destinationUserId, sourceUserId } = JSON.parse(
    JSON.parse(record.body).Message,
  )['detail'] as UserMergeEvent;
  const putItemCommand = new UpdateCommand({
    Key: { id: `${destinationUserId}_merged` },
    TableName: config.trackingTable.name,
    UpdateExpression: 'ADD #sids :id',
    ExpressionAttributeNames: { '#sids': 'sourceIds' },
    ExpressionAttributeValues: { ':id': new Set([sourceUserId]) },
  });
  await client.send(putItemCommand);
}
