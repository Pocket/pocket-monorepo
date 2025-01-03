import { config } from './config/index.ts';
import * as Sentry from '@sentry/aws-serverless';
Sentry.init({
  ...config.sentry,
});

import { getHandler } from './handler.ts';
import { SQSClient } from '@aws-sdk/client-sqs';

export const client = new SQSClient({
  endpoint: config.aws.sqs.endpoint,
  region: config.aws.region,
});

export const processor = getHandler(client, config.aws.sqs);

export const handler = Sentry.wrapHandler(processor);
