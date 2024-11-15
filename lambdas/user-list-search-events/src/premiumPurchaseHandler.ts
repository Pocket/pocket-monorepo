import { PremiumPurchaseEvent } from '@pocket-tools/event-bridge';

/**
 * Given an account delete event, call the batchDelete endpoint on the
 * user-list-search to delete all indexes associated with the user.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function premiumPurchaseHandler(
  event: PremiumPurchaseEvent[],
): Promise<void> {}
