import { config } from './config';
import { initSentry, featureFlagTraceSampler } from '@pocket-tools/sentry';
import { unleash } from './datasource/clients';

const unleashClient = unleash();

// Initialize Sentry
initSentry({
  ...config.sentry,
  tracesSampler: featureFlagTraceSampler(
    unleashClient,
    config.sentry.samplerFlag,
  ),
  debug: config.sentry.environment === 'development',
});

import { startServer } from './server/serverUtils';
import { serverLogger } from '@pocket-tools/ts-logger';

// Wait to start the server until unleash client is initialized
unleashClient.once('synchronized', () =>
  startServer(config.app.port).then(({ url }) => {
    serverLogger.info(
      `🚀 Public server ready at http://localhost:${config.app.port}${url}`,
    );
  }),
);
