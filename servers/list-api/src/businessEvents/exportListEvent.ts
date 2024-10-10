import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { BasicItemEventPayloadContext } from './types';
import config from '../config';
import { eventBridgeClient } from '../aws/eventBridgeClient';
import { EventBridgeBase } from '../aws/eventBridgeBase';

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
  context: BasicItemEventPayloadContext,
) {
  const payload = {
    ...context,
    userId: context.user.id,
    encodedId: context.user.hashedId,
    requestId,
    // Initial values for requesting first chunk
    part: 0,
    cursor: -1,
  };
  const command = new PutEventsCommand({
    Entries: [
      {
        EventBusName: config.aws.eventBus.name,
        Detail: JSON.stringify(payload),
        Source: config.serviceName,
        DetailType: 'list-export-requested',
      },
    ],
  });
  const client = new EventBridgeBase(eventBridgeClient);
  await client.putEvents(command);
}
