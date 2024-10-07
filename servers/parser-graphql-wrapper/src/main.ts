//this must run before all imports and server start
//so open-telemetry can patch all libraries that we use
import config from './config';
import { initSentry, featureFlagTraceSampler } from '@pocket-tools/sentry';
import { nodeSDKBuilder } from '@pocket-tools/tracing';

import { unleash } from './unleash';
const unleashClient = unleash();
// Initialize sentry
const sentry = initSentry({
  ...config.sentry,
  skipOpenTelemetrySetup: true,
  tracesSampler: featureFlagTraceSampler(
    unleashClient,
    config.sentry.samplerFlag,
  ),
  debug: config.sentry.environment === 'development',
});

nodeSDKBuilder({ ...config.tracing, sentry: sentry }).then(() => {
  startServer(config.app.serverPort).then(({ url }) => {
    serverLogger.info(
      `🚀 Public server ready at http://localhost:${config.app.serverPort}${url}`,
    );
  });
});
import { serverLogger } from '@pocket-tools/ts-logger';
import { startServer } from './apollo/server';
