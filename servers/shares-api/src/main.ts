//this must run before all imports and server start
//so open-telemetry can patch all libraries that we use
import { nodeSDKBuilder } from '@pocket-tools/tracing';
import { serverLogger } from '@pocket-tools/ts-logger';
import { config } from './config';

nodeSDKBuilder({
  host: config.tracing.host,
  serviceName: config.tracing.serviceName,
  release: config.sentry.release,
  logger: serverLogger,
}).then(async () => {
  await startServer(config.app.port);
  serverLogger.info(`🚀 Server ready at http://localhost:${config.app.port}`);
});

import { startServer } from './apollo/server';
