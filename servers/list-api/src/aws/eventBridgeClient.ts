import { PocketEventBridgeClient } from '@pocket-tools/event-bridge';
import config from '../config';

export const eventBridgeClient = new PocketEventBridgeClient({
  aws: {
    endpoint: config.aws.endpoint,
    region: config.aws.region,
    maxAttempts: config.aws.maxRetries,
  },
  eventBus: { name: config.aws.eventBus.name },
});
