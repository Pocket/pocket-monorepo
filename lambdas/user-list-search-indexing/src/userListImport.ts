import { config } from './config/index.ts';
import * as Sentry from '@sentry/aws-serverless';
Sentry.init({
  ...config.sentry,
});
import type { UserListImportSqsMessage } from './types.ts';
import type { SQSEvent, SQSRecord } from 'aws-lambda';
import { processUserImport } from './helper.ts';

export const processor = async (event: SQSEvent): Promise<boolean[]> => {
  return await Promise.all(
    event.Records.map((record: SQSRecord) => {
      return processUserImport(
        JSON.parse(record.body) as UserListImportSqsMessage,
        config.search.endpoint + config.search.userListImport,
      );
    }),
  );
};

export const handler = Sentry.wrapHandler(processor);
