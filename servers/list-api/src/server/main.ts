import config from '../config';
import { initSentry, featureFlagTraceSampler } from '@pocket-tools/sentry';
import { getClient } from '../featureFlags';
import { nodeSDKBuilder } from '@pocket-tools/tracing';

const unleashClient = getClient();
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
  startServer(config.app.port).then(() => {
    serverLogger.info(
      `🚀 Public server ready at http://localhost:${config.app.port}`,
    );
  });
});
import { serverLogger } from '@pocket-tools/ts-logger';
import { startServer } from './apollo';
