import { SQS } from '@aws-sdk/client-sqs';
import config from '../config';

export const sqs = new SQS({
  region: config.aws.region,
  endpoint: config.aws.endpoint,
  maxAttempts: 3,
});
