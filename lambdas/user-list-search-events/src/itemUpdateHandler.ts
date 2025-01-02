import {
  ListEvent as BaseEvent,
  IncomingBaseEvent,
} from '@pocket-tools/event-bridge';
import { PocketEventRecord } from './handlerMap';
import { config } from './config';
import { sendMessage } from './sqsClient';
import { serverLogger } from '@pocket-tools/ts-logger';

type ListEvent = Exclude<PocketEventRecord, 'pocketEvent'> & {
  pocketEvent: BaseEvent & IncomingBaseEvent;
};

/**
 * NOTE: Even though our SQS queue message can handle multiple user items, we are only sending one item at a time for easier error tracking.
 * This is similar to the old Kinesis to SQS handler.
 *
 * Given an item update event, load the item to update to the SQS queue
 * @param record Pocket Event containing forwarded event from eventbridge
 */
export async function itemUpdateHandler(
  events: ListEvent[],
): Promise<string[]> {
  const failedIds: string[] = [];
  for (const record of events) {
    const savedItemId = record.pocketEvent.detail.savedItem.id
      ? parseInt(record.pocketEvent.detail.savedItem.id)
      : null;
    if (!savedItemId) {
      failedIds.push(record.messageId);
      continue;
    }

    try {
      await sendMessage(
        {
          userItems: [
            {
              userId: record.pocketEvent.detail.user.id,
              itemIds: [savedItemId],
            },
          ],
        },
        config.aws.sqs.userItemsUpdateUrl,
      );
    } catch (error) {
      serverLogger.error('Failed to send message to Item Update SQS', error);
      failedIds.push(record.messageId);
    }
  }

  return failedIds;
}
