import { SQSEvent, SQSRecord } from 'aws-lambda';
import { processUserItem } from './helper';
import * as Sentry from '@sentry/serverless';
import { config } from './config';
import { UserItemsSqsMessage } from './types';

Sentry.AWSLambda.init({
  ...config.sentry,
});

export const processor = async (event: SQSEvent): Promise<boolean[]> => {
  return await Promise.all(
    event.Records.map((record: SQSRecord) => {
      return processUserItem(
        JSON.parse(record.body) as UserItemsSqsMessage,
        config.search.endpoint + config.search.itemDelete,
      );
    }),
  );
};

export const handler = Sentry.AWSLambda.wrapHandler(processor);
