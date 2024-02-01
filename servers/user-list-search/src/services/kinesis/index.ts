import { config } from '../../config';
import { getHandler } from './handler';
import { SQSClient } from '@aws-sdk/client-sqs';

export const client = new SQSClient({
    endpoint: config.aws.sqs.endpoint,
    region: config.aws.region
});

export const handler = getHandler(client, config.aws.sqs);
