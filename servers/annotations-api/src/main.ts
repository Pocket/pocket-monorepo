import config from './config';
import { initSentry } from '@pocket-tools/sentry';
initSentry({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
  skipOpenTelemetrySetup: true,
});
//this must run before all imports and server start but after sentry
//so open-telemetry can patch all libraries that we use
import {
  nodeSDKBuilder,
  AdditionalInstrumentation,
} from '@pocket-tools/tracing';
import { serverLogger } from '@pocket-tools/ts-logger';

nodeSDKBuilder({
  host: config.tracing.host,
  serviceName: config.tracing.serviceName,
  release: config.sentry.release,
  logger: serverLogger,
  additionalInstrumentations: [AdditionalInstrumentation.KNEX],
  addSentry: true,
}).then(async () => {
  // init BatchDeleteHandler, SQS queue is not
  // present in localstack for integration testing
  // Start BatchDelete queue polling
  new BatchDeleteHandler(new EventEmitter());

  await startServer(config.app.port);
  serverLogger.info(`🚀 Server ready at http://localhost:${config.app.port}`);
});

import { startServer } from './server';
import { EventEmitter } from 'events';
import { BatchDeleteHandler } from './server/aws/batchDeleteHandler';
