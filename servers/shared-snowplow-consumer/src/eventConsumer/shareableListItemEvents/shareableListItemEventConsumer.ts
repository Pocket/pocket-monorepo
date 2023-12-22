import { ShareableListItemEventPayloadSnowplow } from '../../snowplow/shareableListItem/types';
import { ShareableListItemEventHandler } from '../../snowplow/shareableListItem/shareableListItemEventHandler';

export function shareableListItemEventConsumer(requestBody: any) {
  new ShareableListItemEventHandler().process(
    getShareableListItemEventPayload(requestBody)
  );
}

/**
 * converts the event-bridge event format to snowplow payload
 * for a ShareableListItem event
 * @param eventObj event bridge event format
 */
export function getShareableListItemEventPayload(
  eventObj: any
): ShareableListItemEventPayloadSnowplow {
  const eventPayload = eventObj['detail'];
  const detailType = eventObj['detail-type'];

  return {
    shareable_list_item: eventPayload['shareableListItem'],
    eventType: detailType,
  };
}
