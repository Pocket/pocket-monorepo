import { ShareableListEventPayloadSnowplow } from '../../snowplow/shareableList/types';
import { ShareableListEventHandler } from '../../snowplow/shareableList/shareableListEventHandler';

export function shareableListEventConsumer(requestBody: any) {
  new ShareableListEventHandler().process(
    getShareableListEventPayload(requestBody)
  );
}

/**
 * converts the event-bridge event format to snowplow payload
 * for a ShareableList event
 * @param eventObj event bridge event format
 */
export function getShareableListEventPayload(
  eventObj: any
): ShareableListEventPayloadSnowplow {
  const eventPayload = eventObj['detail'];
  const detailType = eventObj['detail-type'];

  return {
    shareable_list: eventPayload['shareableList'],
    eventType: detailType,
  };
}
