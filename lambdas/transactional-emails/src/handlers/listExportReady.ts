import { SQSRecord } from 'aws-lambda';
import { sendListExportReadyEmail } from '../braze';
import {
  PocketEventType,
  sqsEventBridgeEvent,
} from '@pocket-tools/event-bridge';

/**
 * Given an list export ready event, make a request to send the export ready
 * email.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function exportReadyHandler(record: SQSRecord) {
  const event = sqsEventBridgeEvent(record);
  if (event?.['detail-type'] === PocketEventType.EXPORT_READY) {
    await sendListExportReadyEmail({
      archiveUrl: event.detail.archiveUrl,
      encodedId: event.detail.encodedId,
      requestId: event.detail.requestId,
    });
  }
}
