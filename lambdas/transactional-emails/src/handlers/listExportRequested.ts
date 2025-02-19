import { sendExportRequestAcknowledged } from '../braze.ts';
import { PocketEvent, PocketEventType } from '@pocket-tools/event-bridge';

/**
 * Given an list export ready event, make a request to send the export ready
 * email.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function exportRequestedHandler(event: PocketEvent) {
  if (event?.['detail-type'] === PocketEventType.EXPORT_REQUESTED) {
    await sendExportRequestAcknowledged({
      encodedId: event.detail.encodedId,
      requestId: event.detail.requestId,
    });
  }
}
