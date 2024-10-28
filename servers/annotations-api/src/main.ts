import config from './config';
import { initSentry } from '@pocket-tools/sentry';

// Init sentry MUST come before any other imports for auto instrumentation to kick in (request isolation)
initSentry({
  ...config.sentry,
  skipOpenTelemetrySetup: true,
  integrations(integrations) {
    return integrations.filter((integration) => {
      return integration.name !== 'NodeFetch';
    });
  },
});

import { nodeSDKBuilder } from '@pocket-tools/tracing';
import { unleash } from './unleash';
nodeSDKBuilder({ ...config.tracing, unleash: unleash() }).then(() => {
  startServer(config.app.port).then(async () => {
    // init BatchDeleteHandler, SQS queue is not
    // present in localstack for integration testing
    // Start BatchDelete queue polling
    new BatchDeleteHandler(new EventEmitter());
    serverLogger.info(`🚀 Server ready at http://localhost:${config.app.port}`);
  });
});
import { serverLogger } from '@pocket-tools/ts-logger';
import { startServer } from './server';
import { BatchDeleteHandler } from './server/aws/batchDeleteHandler';
import { EventEmitter } from 'events';
