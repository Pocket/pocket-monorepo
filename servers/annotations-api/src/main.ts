import config from './config';
import { EventEmitter } from 'events';
import { BatchDeleteHandler } from './server/aws/batchDeleteHandler';
import { serverLogger, startServer } from './server';

// init BatchDeleteHandler outside server, SQS queue is not
// present in localstack for integration testing
// Start BatchDelete queue polling
new BatchDeleteHandler(new EventEmitter());

(async () => {
  await startServer(config.app.port);
  serverLogger.info(`🚀 Server ready at http://localhost:${config.app.port}/`);
})();
