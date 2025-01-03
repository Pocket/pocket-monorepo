import { config } from './config/index.ts';
import * as Sentry from '@sentry/aws-serverless';
Sentry.init({
  ...config.sentry,
});
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { processUserItem } from './helper.ts';
import { UserItemsSqsMessage } from './types.ts';

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

export const handler = Sentry.wrapHandler(processor);
