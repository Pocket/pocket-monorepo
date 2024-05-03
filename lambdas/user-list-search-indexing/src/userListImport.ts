import { SQSEvent, SQSRecord } from 'aws-lambda';
import { processUserImport } from './helper.js';
import * as Sentry from '@sentry/serverless';
import { config } from './config/index.js';
import { UserListImportSqsMessage } from './types.js';

Sentry.AWSLambda.init({
  ...config.sentry,
});

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

export const handler = Sentry.AWSLambda.wrapHandler(processor);
