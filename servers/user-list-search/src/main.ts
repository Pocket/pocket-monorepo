import { config } from './config';
import { initSentry, featureFlagTraceSampler } from '@pocket-tools/sentry';
import { unleash } from './datasource/clients';
import { nodeSDKBuilder } from '@pocket-tools/tracing';

const unleashClient = unleash();

// Initialize Sentry
const sentry = initSentry({
  ...config.sentry,
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
import { startServer } from './server/serverUtils';
