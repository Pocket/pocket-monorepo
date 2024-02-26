import { SQSEvent, SQSRecord } from 'aws-lambda';
import { processBody } from './userItemsDelete';
import * as Sentry from '@sentry/serverless';
import { config } from '../../config';

Sentry.AWSLambda.init({
  ...config.sentry,
});

export const processor = async (event: SQSEvent): Promise<boolean[]> => {
  return await Promise.all(
    event.Records.map((record: SQSRecord) => {
      return processBody(record.body);
    }),
  );
};

export const handler = Sentry.AWSLambda.wrapHandler(processor);
