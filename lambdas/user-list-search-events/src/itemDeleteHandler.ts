import { DeleteItem, IncomingBaseEvent } from '@pocket-tools/event-bridge';
import { PocketEventRecord } from './handlerMap';

type DeleteItemEvent = Exclude<PocketEventRecord, 'pocketEvent'> & {
  pocketEvent: DeleteItem & IncomingBaseEvent;
};

/**
 * Given an item delete event, load the item to delete to the SQS queue
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function itemDeleteHandler(
  event: DeleteItemEvent[],
): Promise<string[]> {
  return [];
}
