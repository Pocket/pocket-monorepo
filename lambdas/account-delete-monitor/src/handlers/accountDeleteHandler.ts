import { SQSRecord } from 'aws-lambda';
import { client } from '../dynamodb.js';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../config.js';
// import { expirationTimestamp } from '../utils';
import { epochMsToIsoDate } from '../utils.js';
import { DeleteRequestModel } from '../types.js';
import { deleteUserMutationCaller } from '../externalCaller/deleteMutation.js';

/**
 * Store the account deletion request in DynamoDB for tracking, and to
 * make it easier to retry records that failed to be deleted (as the
 * user record will be immediately removed).
 * @param record SNSEventRecord containing forwarded event from eventbridge
 */
export async function accountDeleteHandler(record: SQSRecord) {
  const { userId, email } = JSON.parse(JSON.parse(record.body).Message)[
    'detail'
  ];
  const ms = parseInt(record.attributes.SentTimestamp);
  const Item: DeleteRequestModel = {
    id: userId + '_request',
    email,
    timestamp: new Date(ms).toISOString(),
    date: epochMsToIsoDate(ms),
    // TODO: Include later
    // expiresAt: expirationTimestamp(config.trackingTable.daysToLive),
  };
  const putItemCommand = new PutCommand({
    Item,
    TableName: config.trackingTable.name,
  });
  await client.send(putItemCommand);

  await deleteOldAccounts(userId);
}

/**
 * Initiates PII deletion of old user accounts associated with this userID
 * @param userId id for which the old account's PII will be deleted
 */
export async function deleteOldAccounts(userId: string) {
  const oldUserIds: string[] = await getOldUserIds(userId);
  for (const id of oldUserIds) {
    await deleteUserMutationCaller(id);
  }
}

/**
 * retrieves old pocket accounts associated with the userId
 * @param userId id for which the old account's userId will be retrieved
 * @returns old userIds or empty array if nothing exists.
 */
export async function getOldUserIds(userId: string): Promise<string[]> {
  const res = await client.send(
    new GetCommand({
      TableName: config.trackingTable.name,
      Key: { id: `${userId}_merged` },
    }),
  );

  return res.Item ? Array.from(res.Item['sourceIds']) : [];
}
