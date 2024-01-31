import { config } from '../../config';
import SQS from 'aws-sdk/clients/sqs';
import { getHandler } from './handler';

export const client = new SQS();

export const handler = getHandler(client, config.aws.sqs);
