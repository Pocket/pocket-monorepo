import { config } from './config';
import * as Sentry from '@sentry/aws-serverless';
Sentry.init({
  dsn: config.sentry.dsn,
  release: config.sentry.release,
  environment: config.app.environment,
  serverName: config.app.name,
});
import { SQSBatchItemFailure, SQSEvent } from 'aws-lambda';
import { handlers } from './handlers';

export async function handlerFn(event: SQSEvent): Promise<any> {
  const batchFailures: SQSBatchItemFailure[] = [];
  for await (const record of event.Records) {
    try {
      const message = JSON.parse(JSON.parse(record.body).Message);
      if (handlers[message['detail-type']] == null) {
        //if detail-type is null, ignore and move on to next event
        //this means the consumer doesn't have to process this event
        continue;
      }

      await handlers[message['detail-type']](record);
    } catch (error) {
      console.log(error);
      Sentry.captureException(error);
      batchFailures.push({ itemIdentifier: record.messageId });
    }
  }
  return { batchItemFailures: batchFailures };
}

export const handler = Sentry.wrapHandler(handlerFn);
