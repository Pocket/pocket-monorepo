//this must run before all imports and server start
//so open-telemetry can patch all libraries that we use
import { nodeSDKBuilder } from '@pocket-tools/tracing';
import config from './config';
import { serverLogger } from '@pocket-tools/ts-logger';
import { initSentry } from '@pocket-tools/sentry';
// Initialize sentry
initSentry({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
  skipOpenTelemetrySetup: true,
});

nodeSDKBuilder({
  host: config.tracing.host,
  serviceName: config.tracing.serviceName,
  release: config.sentry.release,
  logger: serverLogger,
  addSentry: true,
}).then(async () => {
  const { url } = await startServer(config.app.serverPort);
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.serverPort}${url}`,
  );
});

import { startServer } from './apollo/server';
