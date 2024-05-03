//this must run before all imports and server start
//so open-telemetry can patch all libraries that we use
import { nodeSDKBuilder } from '@pocket-tools/tracing';
import config from '../config/index.js';
import { serverLogger } from '@pocket-tools/ts-logger';

nodeSDKBuilder({
  host: config.tracing.host,
  serviceName: config.tracing.serviceName,
  release: config.sentry.release,
  logger: serverLogger,
}).then(async () => {
  await startServer(config.app.serverPort);
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.serverPort}`,
  );
});

import { startServer } from './apollo.js';
