import { ShareableListEventHandler } from '../../snowplow/shareableList/shareableListEventHandler.js';
import { ShareableListEventBridgePayload } from './types.js';

export function shareableListEventConsumer(
  requestBody: ShareableListEventBridgePayload,
) {
  new ShareableListEventHandler().process(requestBody);
}
