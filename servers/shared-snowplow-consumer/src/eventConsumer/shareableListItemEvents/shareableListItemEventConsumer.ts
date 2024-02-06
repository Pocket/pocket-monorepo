import { ShareableListItemEventHandler } from '../../snowplow/shareableListItem/shareableListItemEventHandler';
import { ShareableListItemEventBridgePayload } from './types';

export function shareableListItemEventConsumer(
  requestBody: ShareableListItemEventBridgePayload,
) {
  new ShareableListItemEventHandler().process(requestBody);
}
