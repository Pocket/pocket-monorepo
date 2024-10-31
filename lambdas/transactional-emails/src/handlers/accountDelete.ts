import { SQSRecord } from 'aws-lambda';
import { sendAccountDeletionEmail } from '../braze';
import {
  PocketEventType,
  sqsEventBridgeEvent,
} from '@pocket-tools/event-bridge';

/**
 * Given an account delete event, make a request to send the account deletion
 * email.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function accountDeleteHandler(record: SQSRecord) {
  const event = sqsEventBridgeEvent(record);
  if (event?.['detail-type'] === PocketEventType.ACCOUNT_DELETION) {
    return await sendAccountDeletionEmail(event.detail.email);
  }
  return;
}
