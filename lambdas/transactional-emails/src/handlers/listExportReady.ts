import { sendListExportReadyEmail } from '../braze';
import { PocketEvent, PocketEventType } from '@pocket-tools/event-bridge';

/**
 * Given an list export ready event, make a request to send the export ready
 * email.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function exportReadyHandler(event: PocketEvent) {
  if (event?.['detail-type'] === PocketEventType.EXPORT_READY) {
    await sendListExportReadyEmail({
      archiveUrl: event.detail.archiveUrl ?? undefined, // null is not the same as undefined..
      encodedId: event.detail.encodedId,
      requestId: event.detail.requestId,
    });
  }
}
