import {
  EventTypeString,
  Prospect,
  ProspectEventPayloadSnowplow,
} from '../../snowplow/prospect/types';
import { ProspectEventHandler } from '../../snowplow/prospect/prospectEventHandler';

//detail-type in event rule
//defined here:
// https://github.com/Pocket/pocket-event-bridge/blob/f462cbb1b166d937fcd62319f88c90efc7653ebc/.aws/src/event-rules/user-api-events/eventConfig.ts#L3
export const DetailTypeToSnowplowMap: Record<string, EventTypeString> = {
  'prospect-dismiss': 'PROSPECT_REVIEWED',
};

//event bridge payload for prospect
export type ProspectEventBusPayload = Prospect;

export function prospectEventConsumer(requestBody: any) {
  new ProspectEventHandler().process(getProspectEventPayload(requestBody));
}

/**
 * converts the event-bridge event format to snowplow payload
 * for prospect event
 * @param eventObj event bridge event format
 */
export function getProspectEventPayload(
  eventObj: any
): ProspectEventPayloadSnowplow {
  const eventPayload: ProspectEventBusPayload = eventObj['detail'];
  const detailType = eventObj['detail-type'];
  return {
    prospect: eventPayload,
    object_version: 'new',
    eventType: DetailTypeToSnowplowMap[detailType],
  };
}
