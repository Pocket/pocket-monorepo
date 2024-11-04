import config from '../config';
import { eventBridgeClient } from '../aws/eventBridgeClient';
import {
  BasicListItemEventPayloadContext,
  ExportRequested,
  PocketEventType,
} from '@pocket-tools/event-bridge';

/**
 * The way that the event handlers were set up previously
 * was to make it easy to fan out internal events to multiple
 * sources (snowplow, sqs queue, kinesis, event bridge),
 * before we had a central event bus.
 * Breaking the pattern here because we just need to send this
 * to the bus.
 */
export async function exportListEvent(
  requestId: string,
  context: BasicListItemEventPayloadContext,
) {
  const payload: ExportRequested = {
    'detail-type': PocketEventType.EXPORT_REQUESTED,
    source: config.serviceName,
    detail: {
      ...context,
      userId: context.user.id,
      encodedId: context.user.hashedId,
      requestId,
      // Initial values for requesting first chunk
      part: 0,
      cursor: -1,
    },
  };
  await eventBridgeClient.sendPocketEvent(payload);
}
