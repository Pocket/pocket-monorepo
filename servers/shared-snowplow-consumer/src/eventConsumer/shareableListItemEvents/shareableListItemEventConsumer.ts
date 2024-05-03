import { ShareableListItemEventHandler } from '../../snowplow/shareableListItem/shareableListItemEventHandler.js';
import { ShareableListItemEventBridgePayload } from './types.js';

export function shareableListItemEventConsumer(
  requestBody: ShareableListItemEventBridgePayload,
) {
  new ShareableListItemEventHandler().process(requestBody);
}
