import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { config } from '../config';

let client: EventBridgeClient;

export function eventBridgeClient() {
  if (client) return client;
  client = new EventBridgeClient({
    region: config.aws.region,
  });
  return client;
}
