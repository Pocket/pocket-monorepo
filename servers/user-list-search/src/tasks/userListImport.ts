import { DataSourceInterface } from '../datasource/DataSourceInterface';
import { config } from '../config';
import { deleteMessage, receiveMessage, sendMessage } from '../sqs';
import { UserItemsSqsMessage, UserListImportSqsMessage } from '../shared';
import { captureException } from '../sentry';

const ITEMS_CHUNK_SIZE = 1000;

/**
 * Creates the sqs message
 * @param userId
 * @param itemIds
 */
export const createUserItemsUpdateQueueMessage = (
  userId: number,
  itemIds: number[],
): UserItemsSqsMessage => {
  return {
    userItems: [{ userId, itemIds }],
  };
};

/**
 * Process user's item ids by adding it to the user items update queue
 * @param userId
 * @param itemIds
 */
export const processItemIds = async (
  userId: number,
  itemIds: number[],
): Promise<void> => {
  const userItemsUpdateQueueMessage = createUserItemsUpdateQueueMessage(
    userId,
    itemIds,
  );

  await sendMessage(
    config.aws.sqs.userItemsUpdateUrl,
    userItemsUpdateQueueMessage,
  );
};

/**
 *
 * @param body
 * @param dataSource
 */
export const processBody = async (
  body: string,
  dataSource: DataSourceInterface,
): Promise<boolean> => {
  // TODO: How to handle errors with corerupted messages?
  const messageBody: UserListImportSqsMessage = JSON.parse(body);

  for (const user of messageBody.users) {
    const { userId } = user;
    console.log('Started processing', { userId });

    const itemIds = await dataSource.getUserItemIds(userId);

    console.log('Found items', {
      userId,
      itemCount: itemIds.length,
    });
    for (let start = 0; start < itemIds.length; start += ITEMS_CHUNK_SIZE) {
      console.log('Creating chunk of items to process', {
        userId,
        start: start,
        end: start + ITEMS_CHUNK_SIZE,
      });

      const chunkedItemIds = itemIds.slice(start, start + ITEMS_CHUNK_SIZE);

      await processItemIds(userId, chunkedItemIds);
    }

    console.log('Completed processing', {
      userId,
    });
  }

  return true;
};

/**
 * Processes the messages in the Backfill User Search Queue
 * @param dataSource
 */
export const processMessages = async (
  dataSource: DataSourceInterface,
): Promise<void> => {
  try {
    const userListImportUrl = config.aws.sqs.userListImportUrl;

    const { Messages: messages } = await receiveMessage(userListImportUrl);

    // If there are no messages in the queue after a long poll(default is 20 secs), return
    if (!messages) return;

    for (const message of messages) {
      await processBody(message.Body, dataSource);
      await deleteMessage(userListImportUrl, message.ReceiptHandle);
    }
  } catch (error) {
    captureException(error);
    console.error('Error processing backfill user search index', error);
  }
};
