import { SQSEvent, SQSRecord } from 'aws-lambda';
import { processBody } from '../../tasks/userListImport';
import { MysqlDataSource } from '../../datasource/MysqlDataSource';
import * as Sentry from '@sentry/serverless';
import { config } from '../../config';

Sentry.AWSLambda.init({
  ...config.sentry,
});

const mysql = new MysqlDataSource();

export const processor = async (event: SQSEvent): Promise<boolean[]> => {
  return await Promise.all(
    event.Records.map((record: SQSRecord) => {
      return processBody(record.body, mysql);
    }),
  );
};

export const handler = Sentry.AWSLambda.wrapHandler(processor);
