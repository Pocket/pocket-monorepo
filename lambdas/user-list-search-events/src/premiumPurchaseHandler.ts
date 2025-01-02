import {
  PremiumPurchaseEvent as BaseEvent,
  IncomingBaseEvent,
} from '@pocket-tools/event-bridge';
import { PocketEventRecord } from './handlerMap';
import { sendMessage } from './sqsClient';
import { config } from './config';
import { serverLogger } from '@pocket-tools/ts-logger';

type PremiumPurchaseEvent = Exclude<PocketEventRecord, 'pocketEvent'> & {
  pocketEvent: BaseEvent & IncomingBaseEvent;
};

/**
 * NOTE: Even though our SQS queue message can handle multiple users, we are only sending one user at a time for easier error tracking.
 * This is similar to the old Kinesis to SQS handler.
 *
 * Given a premium purchase event, load the user to import into the SQS Queue
 * @param record Pocket Event containing forwarded event from eventbridge
 */
export async function premiumPurchaseHandler(
  events: PremiumPurchaseEvent[],
): Promise<string[]> {
  const failedIds: string[] = [];
  for (const record of events) {
    const userId = record.pocketEvent.detail.user.id
      ? parseInt(record.pocketEvent.detail.user.id)
      : null;
    if (!userId) {
      failedIds.push(record.messageId);
      continue;
    }

    try {
      await sendMessage(
        {
          users: [{ userId }],
        },
        config.aws.sqs.userListImportUrl,
      );
    } catch (error) {
      serverLogger.error(
        'Failed to send message to Premium Import SQS Queue',
        error,
      );
      failedIds.push(record.messageId);
    }
  }

  return failedIds;
}
