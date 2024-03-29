//this must run before all imports and server start
//so open-telemetry can patch all libraries that we use
import { nodeSDKBuilder } from '@pocket-tools/tracing';
import { serverLogger } from '@pocket-tools/ts-logger';
import config from './config';

nodeSDKBuilder({
  host: config.tracing.host,
  serviceName: config.tracing.serviceName,
  release: config.sentry.release,
  logger: serverLogger,
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
