import { SQSRecord } from 'aws-lambda';

/**
 * Given a list api event, de-dupe all users, and for each user, grab their push tokens and send a singular instant sync notification
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function instantSyncHandler(records: SQSRecord[]): Promise<void> {
  console.log(`Received ${records.length} events to process`);
}
