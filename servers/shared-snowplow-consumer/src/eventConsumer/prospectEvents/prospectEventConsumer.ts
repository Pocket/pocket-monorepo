import { ProspectEventHandler } from '../../snowplow/prospect/prospectEventHandler';
import { ProspectEventBridgePayload } from './types';

export function prospectEventConsumer(requestBody: ProspectEventBridgePayload) {
  new ProspectEventHandler().process(requestBody);
}
