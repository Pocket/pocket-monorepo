import { config } from './config';
import { initSentry } from '@pocket-tools/sentry';
initSentry({
  ...config.sentry,
});

//this must run before all imports and server start but after sentry
//so open-telemetry can patch all libraries that we use
startServer(config.app.port).then(() => {
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.port}`,
  );

  new PocketEventBridgeSQSConsumer({
    queueUrl: config.aws.sqs.sharedSnowplowQueue.url,
    sqs: new SQSClient({
      region: config.aws.region,
      endpoint: config.aws.endpoint,
      maxAttempts: 3,
    }),
    handlePocketEvent: async (event: PocketEvent) => {
      eventConsumer[event['detail-type']](event);
      return;
    },
  }).start();
});
import { startServer } from './server';
import {
  PocketEvent,
  PocketEventBridgeSQSConsumer,
} from '@pocket-tools/event-bridge';
import { serverLogger } from '@pocket-tools/ts-logger';
import { SQSClient } from '@aws-sdk/client-sqs';
import { eventConsumer } from './eventConsumer';
