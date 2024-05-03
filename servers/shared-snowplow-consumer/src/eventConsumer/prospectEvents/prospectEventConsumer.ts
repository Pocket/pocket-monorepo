import { ProspectEventHandler } from '../../snowplow/prospect/prospectEventHandler.js';
import { ProspectEventBridgePayload } from './types.js';

export function prospectEventConsumer(requestBody: ProspectEventBridgePayload) {
  new ProspectEventHandler().process(requestBody);
}
