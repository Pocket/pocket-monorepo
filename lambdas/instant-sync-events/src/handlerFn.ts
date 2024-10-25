import { SQSRecord, SQSBatchResponse, SQSBatchItemFailure } from 'aws-lambda';
import { readClient, writeClient } from './clients';
import { client } from './sqs';
import {
  SendMessageBatchCommand,
  SendMessageBatchRequestEntry,
} from '@aws-sdk/client-sqs';
import { config } from './config';
import { nanoid } from 'nanoid';
import { serverLogger } from '@pocket-tools/ts-logger';

export const eventTypes = [
  'ADD_ITEM',
  'DELETE_ITEM',
  'FAVORITE_ITEM',
  'UNFAVORITE_ITEM',
  'ARCHIVE_ITEM',
  'UNARCHIVE_ITEM',
  'ADD_TAGS',
  'REPLACE_TAGS',
  'CLEAR_TAGS',
  'REMOVE_TAGS',
  'RENAME_TAG',
  'DELETE_TAG',
  'UPDATE_TITLE',
];

export const sourceTypes = ['list-api'];

export type Message = {
  'detail-type': string;
  source: string;
  detail: Detail;
};

export type Detail = {
  user: User;
  // There are other objects here that we don't need for this use case
};

/**
 * Helper type for the User object that is embedded in the list-api detail data
 */
export type User = {
  id: string;
  // used to ensure we don't push notifiy the device that triggered the action.
  hashedGuid: string;
};

/**
 * Database representation of push_tokens
 */
export type TokenEntry = {
  token: string;
  user_id: number;
  platform: string; // ios, android
  push_type: string; //prod, prodalpha..
};

/**
 * Given a list api event, de-dupe all users, and for each user, grab their push tokens and send a singular instant sync notification
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export const instantSyncHandler = async (
  records: SQSRecord[],
): Promise<SQSBatchResponse> => {
  const batchFailures: SQSBatchItemFailure[] = [];

  serverLogger.info(`Received ${records.length} records to process`);
  const userIds = filterUserIds(records);

  const db = await readClient();
  const tokens: TokenEntry[] = await db('push_tokens')
    .select('push_type', 'platform', 'token', 'user_id')
    .whereIn('user_id', userIds)
    .andWhere('expires_at', '>', new Date());

  if (tokens.length === 0) {
    serverLogger.info(`No tokens for users to process`);
    return { batchItemFailures: batchFailures };
  }

  const entries: SendMessageBatchRequestEntry[] = tokens.map((tokenEntry) =>
    convertToSqsEntry(tokenEntry),
  );

  serverLogger.info(`Sending ${userIds.length} to instant sync`);

  await client.send(
    new SendMessageBatchCommand({
      QueueUrl: config.pushQueueUrl,
      Entries: entries,
    }),
  );
  serverLogger.info(`Sent ${userIds.length} to instant sync`);

  const writeDb = await writeClient();
  const cleanedUpRecords = await writeDb('push_tokens')
    .delete()
    .whereIn('user_id', userIds)
    .andWhere('expires_at', '<', new Date());
  serverLogger.info(`Cleaning up ${cleanedUpRecords}`);

  await writeDb.destroy();
  await db.destroy();

  return { batchItemFailures: batchFailures };
};

/**
 * Given a set of SQSRecords lets grab all the user ids
 * @param records
 * @returns
 */
export const filterUserIds = (records: SQSRecord[]): string[] => {
  const userIds = records
    .map(
      (record: SQSRecord) =>
        JSON.parse(JSON.parse(record.body).Message) as Message,
    )
    .filter(
      (message: Message) =>
        eventTypes.includes(message['detail-type']) &&
        sourceTypes.includes(message.source),
    )
    .map((message: Message) => message.detail.user.id);

  // dedupe by making it a set
  return [...new Set(userIds)];
};

/**
 * Convert a JSON object to an SQS send message entry
 * @param message
 */
function convertToSqsEntry(entry: TokenEntry): SendMessageBatchRequestEntry {
  return {
    Id: nanoid(),
    MessageBody: JSON.stringify({
      user_id: entry.user_id,
      message: 'Ping',
      target: entry.platform === 'ios' ? 7 : 5,
      recipient: `${entry.push_type}::${entry.token}`,
    }),
  };
}
