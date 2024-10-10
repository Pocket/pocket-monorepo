import { DataSourceInterface } from '../datasource/DataSourceInterface';
import { sendMessage } from '../sqs';
import { UserListImportSqsMessage } from '../shared';
import { config } from '../config';
import { serverLogger } from '@pocket-tools/ts-logger';

const USERS_CHUNK_SIZE = 500;

/**
 * Creates the sqs message
 * @param userId
 * @param itemIds
 */
export const createUserListImportQueueMessage = (
  userIds: number[],
): UserListImportSqsMessage => {
  return {
    users: userIds.map((userId) => {
      return {
        userId,
      };
    }),
  };
};

/**
 * Adds premium user ids to the backfill queue
 * @param userIds
 */
export const queueUserIds = async (
  userIds: number[],
  batchSize: number = USERS_CHUNK_SIZE,
): Promise<void> => {
  let usersChunk: number[];
  let message: UserListImportSqsMessage;

  while (userIds.length) {
    // chunk off USERS_CHUNK_SIZE users each iteration until we've emptied the original array
    usersChunk = userIds.splice(0, batchSize);

    // cutting-edge logging technology
    serverLogger.info(
      `sending ${usersChunk.length} premium users into the backfill queue! ids in this chunk in the next log:`,
    );

    serverLogger.info(usersChunk);

    // create a message with a max of 500 userids
    message = createUserListImportQueueMessage(usersChunk);

    await sendMessage(config.aws.sqs.userListImportBackfillUrl, message);
  }
};

export const run = async (dataSource: DataSourceInterface): Promise<any> => {
  const userIds = await dataSource.getPremiumUserIds();
  queueUserIds(userIds);
};
