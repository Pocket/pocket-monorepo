import { config } from './config';
import { initSentry } from '@pocket-tools/sentry';
initSentry({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
  skipOpenTelemetrySetup: true,
});
import { nodeSDKBuilder } from '@pocket-tools/tracing';
import { serverLogger } from '@pocket-tools/ts-logger';

//this must run before all imports and server start but after sentry
//so open-telemetry can patch all libraries that we use
nodeSDKBuilder({
  host: config.tracing.host,
  serviceName: config.tracing.serviceName,
  release: config.sentry.release,
  logger: serverLogger,
  addSentry: true,
}).then(async () => {
  await startServer(config.app.port);
  serverLogger.info(`🚀 Server ready at http://localhost:${config.app.port}`);
});

import { startServer } from './apollo/server';
