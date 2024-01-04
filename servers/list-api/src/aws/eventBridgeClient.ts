import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import config from '../config';

export const eventBridgeClient = new EventBridgeClient({
  endpoint: config.aws.endpoint,
  region: config.aws.region,
  maxAttempts: config.aws.maxRetries,
});
