import {
  PremiumPurchaseEvent as BaseEvent,
  IncomingBaseEvent,
} from '@pocket-tools/event-bridge';
import { PocketEventRecord } from './handlerMap';

type PremiumPurchaseEvent = Exclude<PocketEventRecord, 'pocketEvent'> & {
  pocketEvent: BaseEvent & IncomingBaseEvent;
};

/**
 * Given an account delete event, call the batchDelete endpoint on the
 * user-list-search to delete all indexes associated with the user.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function premiumPurchaseHandler(
  event: PremiumPurchaseEvent[],
): Promise<string[]> {
  return [];
}
