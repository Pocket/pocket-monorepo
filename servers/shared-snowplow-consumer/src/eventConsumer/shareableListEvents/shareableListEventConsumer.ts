import { ShareableListEventHandler } from '../../snowplow/shareableList/shareableListEventHandler';
import { ShareableListEventBridgePayload } from './types';

export function shareableListEventConsumer(
  requestBody: ShareableListEventBridgePayload,
) {
  new ShareableListEventHandler().process(requestBody);
}
