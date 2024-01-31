import { config } from '../config';
import { deleteFromElasticSearch } from '../elasticsearch';
import { UserItemsSqsMessage } from '../shared';
import { deleteMessage, receiveMessage } from '../sqs';
import { captureProcessException } from '../shared/util';

/**
 *
 * @param body
 */
export const processBody = async (body: string): Promise<boolean> => {
  const messageBody: UserItemsSqsMessage = JSON.parse(body);

  for (const user of messageBody.userItems) {
    const { userId, itemIds } = user;

    console.log(`Started processing sqs items`, {
      userId,
      itemIds,
    });

    const listItems = itemIds.map((itemId) => {
      return { itemId, userId };
    });

    console.log(`Items to process`, {
      userId,
      listItemsCount: listItems.length,
    });

    if (listItems.length > 0) {
      await deleteFromElasticSearch(listItems);
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
 */
export const processMessages = async (): Promise<void> => {
  try {
    const queueUrl = config.aws.sqs.userItemsDeleteUrl;

    const { Messages: messages } = await receiveMessage(queueUrl);

    // If there are no messages in the queue after a long poll(default is 20 secs), return
    if (!messages) return;

    for (const message of messages) {
      await processBody(message.Body);
      await deleteMessage(queueUrl, message.ReceiptHandle);
    }
  } catch (error) {
    captureProcessException(
      'Error processing user search deletion messages',
      error
    );
  }
};
