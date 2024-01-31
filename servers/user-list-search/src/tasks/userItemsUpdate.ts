import { config } from '../config';
import {
  DataSourceInterface,
  ListItemEnriched,
} from '../datasource/DataSourceInterface';
import { indexInElasticSearch } from '../elasticsearch';
import { UserItemsSqsMessage } from '../shared';
import { deleteMessage, receiveMessage } from '../sqs';
import { captureProcessException } from '../shared/util';

/**
 * Construct ListItemEnriched from user and item ids.
 * @param dataSource
 * @param userId
 * @param itemIds
 */
const getUserItems = async (
  dataSource: DataSourceInterface,
  userId: number,
  itemIds: number[]
): Promise<ListItemEnriched[]> => {
  const [listItems, items] = await Promise.all([
    dataSource.getUserListItems(userId, itemIds),
    dataSource.getItems(itemIds),
  ]);

  return listItems.map((listItem) => {
    return {
      ...listItem,
      userId,
      item: items[listItem.itemId],
    };
  });
};

/**
 *
 * @param body
 * @param dataSource
 */
export const processBody = async (
  body: string,
  dataSource: DataSourceInterface
): Promise<boolean> => {
  const messageBody: UserItemsSqsMessage = JSON.parse(body);

  for (const user of messageBody.userItems) {
    const { userId, itemIds } = user;

    if (!(await dataSource.isUserPremium(userId))) {
      console.log(`Not a premium user, skipping`, {
        userId,
      });

      continue;
    }

    console.log(`Started processing sqs items`, {
      userId,
      itemIds,
    });

    const listItems = await getUserItems(dataSource, userId, itemIds);

    console.log(`Items to process`, {
      userId,
      listItemsCount: listItems.length,
    });

    if (listItems.length > 0) {
      await indexInElasticSearch(listItems);
    }

    console.log(`Completed processing items`, {
      userId,
    });
  }

  return true;
};

/**
 * Process SQS Messages
 *
 * @param dataSource
 */
export const processMessages = async (
  dataSource: DataSourceInterface
): Promise<boolean> => {
  try {
    const queueUrl = config.aws.sqs.userItemsUpdateUrl;

    const { Messages: messages } = await receiveMessage(queueUrl);

    // If there are no messages in the queue after a long poll(default is 20 secs), return
    if (!messages) return;

    for (const message of messages) {
      await processBody(message.Body, dataSource);
      await deleteMessage(queueUrl, message.ReceiptHandle);
    }
  } catch (error) {
    captureProcessException('Error processing user search index', error);
  }
};
