import { ListEvent } from '@pocket-tools/event-bridge';
import { UserItemsSqsMessage } from './types';

/**
 * Given an item update event, load the item to update to the SQS queue
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function itemUpdateHandler(event: ListEvent[]): Promise<void> {
  const request: UserItemsSqsMessage = [];
  const userIdItems: Record<number, number[]> = [];
  for (const e of event) {
    const savedItemId = e.detail.savedItem.id
      ? parseInt(e.detail.savedItem.id)
      : null;
    if (savedItemId === null) return;
    if (e.detail.user.id in userIdItems) {
      userIdItems[parseInt(e.detail.user.id)].push(savedItemId);
    } else {
      userIdItems[e.detail.userId] = [e.detail.itemId];
    }
  }
}
