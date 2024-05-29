//this must run before all imports and server start
//so open-telemetry can patch all libraries that we use
import config from './config';
import { initSentry } from '@pocket-tools/sentry';

// Initialize sentry
initSentry({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
  skipOpenTelemetrySetup: true,
});
import { nodeSDKBuilder } from '@pocket-tools/tracing';
import { serverLogger } from '@pocket-tools/ts-logger';

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
