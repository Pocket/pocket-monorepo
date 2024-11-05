import { PocketEventBridgeClient } from '@pocket-tools/event-bridge';
import config from '../config';

export const eventBridgeClient = new PocketEventBridgeClient({
  eventBus: { name: config.aws.eventBus.name },
  aws: { region: config.aws.region },
});
