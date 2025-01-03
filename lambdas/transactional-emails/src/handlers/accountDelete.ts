import { sendAccountDeletionEmail } from '../braze.ts';
import { PocketEvent, PocketEventType } from '@pocket-tools/event-bridge';

/**
 * Given an account delete event, make a request to send the account deletion
 * email.
 * @param event PocketEvent containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function accountDeleteHandler(event: PocketEvent) {
  if (event?.['detail-type'] === PocketEventType.ACCOUNT_DELETION) {
    return await sendAccountDeletionEmail(event.detail.email);
  }
  return;
}
