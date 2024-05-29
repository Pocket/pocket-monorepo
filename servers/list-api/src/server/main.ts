import config from '../config';
import { initSentry } from '@pocket-tools/sentry';
// Initialize sentry
initSentry({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
  skipOpenTelemetrySetup: true,
});

//this must run before all imports and server start but after sentry
//so open-telemetry can patch all libraries that we use
import {
  AdditionalInstrumentation,
  nodeSDKBuilder,
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
  await startServer(config.app.port);
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.port}`,
  );
});

import { startServer } from './apollo';
