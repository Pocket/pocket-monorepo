import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import config from '../config/index.js';

export const eventBridgeClient = new EventBridgeClient({
  region: config.aws.region,
});
