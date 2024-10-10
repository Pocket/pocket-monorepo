import { SQSRecord } from 'aws-lambda';
import { sendListExportReadyEmail } from '../braze';
import { ListExportReadyEvent } from '../schemas/listExportReadyEvent';

/**
 * Validates that email is not null in the forgot password event payload and
 * that we have valid reset information
 * @param message forgot password reset event forwarded from event bridge
 * @returns FogotPasswordResetEvent
 * @throws Error if email is missing in the event payload
 */
export function validateEventPayload(
  event: ListExportReadyEvent,
): ListExportReadyEvent {
  const requiredFields: Array<keyof ListExportReadyEvent> = [
    'encodedId',
    'requestId',
  ];
  for (const field of requiredFields) {
    if (event[field] == null) {
      throw new Error(`${field} is required in event payload`);
    }
  }
  return event;
}

/**
 * Given an list export ready event, make a request to send the export ready
 * email.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function exportReadyHandler(record: SQSRecord) {
  const message = JSON.parse(JSON.parse(record.body).Message)['detail'];

  const event = validateEventPayload(message);

  await sendListExportReadyEmail({
    archiveUrl: event.archiveUrl,
    encodedId: event.encodedId,
    requestId: event.requestId,
  });
}
