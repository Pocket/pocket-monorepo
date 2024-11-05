import { PocketEventBridgeClient } from '@pocket-tools/event-bridge';
import { config } from '../config';

let client: PocketEventBridgeClient;

export function eventBridgeClient() {
  if (client) return client;
  client = new PocketEventBridgeClient({
    eventBus: { name: config.aws.eventBus.name },
    aws: {
      endpoint: config.aws.endpoint,
      region: config.aws.region,
    },
  });
  return client;
}
