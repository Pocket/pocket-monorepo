import { config } from './config';
import { getHandler } from './handler';
import { SQSClient } from '@aws-sdk/client-sqs';
import * as Sentry from '@sentry/serverless';

Sentry.AWSLambda.init({
  ...config.sentry,
});

export const client = new SQSClient({
  endpoint: config.aws.sqs.endpoint,
  region: config.aws.region,
});

export const processor = getHandler(client, config.aws.sqs);

export const handler = Sentry.AWSLambda.wrapHandler(processor);
