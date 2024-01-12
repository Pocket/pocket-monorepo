import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import config from '../config';

export const eventBridgeClient = new EventBridgeClient({
  region: config.aws.region,
});
