import { config } from './config';
import * as Sentry from '@sentry/serverless';
import { SQSEvent } from 'aws-lambda';
import { serverLogger } from '@pocket-tools/ts-logger';

Sentry.AWSLambda.init({
  dsn: config.sentry.dsn,
  release: config.sentry.release,
  environment: config.app.environment,
  serverName: config.app.name,
});

export async function handlerFn(event: SQSEvent): Promise<any> {
  for await (const record of event.Records) {
    try {
      const message = JSON.parse(JSON.parse(record.body).Message);
      serverLogger.info('Event received', message);
    } catch (error) {
      console.log(error);
      Sentry.captureException(error);
    }
  }
  return true;
}

export const handler = Sentry.AWSLambda.wrapHandler(handlerFn);
