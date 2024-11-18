import {
  ListEvent as BaseEvent,
  IncomingBaseEvent,
} from '@pocket-tools/event-bridge';
// import { UserItemsSqsMessage } from './types';
import { PocketEventRecord } from './handlerMap';

type ListEvent = Exclude<PocketEventRecord, 'pocketEvent'> & {
  pocketEvent: BaseEvent & IncomingBaseEvent;
};

/**
 * Given an item update event, load the item to update to the SQS queue
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function itemUpdateHandler(event: ListEvent[]): Promise<string[]> {
  // const request: UserItemsSqsMessage = [];
  const userIdItems: Record<number, number[]> = [];
  for (const e of event) {
    const savedItemId = e.pocketEvent.detail.savedItem.id
      ? parseInt(e.pocketEvent.detail.savedItem.id)
      : null;
    if (savedItemId === null) return [];
    if (e.pocketEvent.detail.user.id in userIdItems) {
      userIdItems[parseInt(e.pocketEvent.detail.user.id)].push(savedItemId);
    } else {
      userIdItems[e.pocketEvent.detail.userId] = [e.pocketEvent.detail.itemId];
    }
  }
  return [];
}
