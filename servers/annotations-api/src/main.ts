import config from './config';
import { initSentry } from '@pocket-tools/sentry';
initSentry({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

import { serverLogger } from '@pocket-tools/ts-logger';
import { startServer } from './server';
import { EventEmitter } from 'events';
import { BatchDeleteHandler } from './server/aws/batchDeleteHandler';

startServer(config.app.port).then(async () => {
  // init BatchDeleteHandler, SQS queue is not
  // present in localstack for integration testing
  // Start BatchDelete queue polling
  new BatchDeleteHandler(new EventEmitter());
  serverLogger.info(`🚀 Server ready at http://localhost:${config.app.port}`);
});
