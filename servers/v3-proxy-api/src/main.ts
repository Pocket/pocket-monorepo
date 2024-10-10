import config from './config';
import { initSentry, featureFlagTraceSampler } from '@pocket-tools/sentry';
import { unleash } from './unleash';
import { nodeSDKBuilder } from '@pocket-tools/tracing';

const unleashClient = unleash();
const sentry = initSentry({
  ...config.sentry,
  skipOpenTelemetrySetup: true,
  // turn off default integrations because we use otel for this data
  defaultIntegrations: false,
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
import { startServer } from './server';
