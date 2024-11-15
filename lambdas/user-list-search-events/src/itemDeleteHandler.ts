import { DeleteItem } from '@pocket-tools/event-bridge';

/**
 * Given an item delete event, load the item to delete to the SQS queue
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function itemDeleteHandler(event: DeleteItem[]): Promise<void> {}
