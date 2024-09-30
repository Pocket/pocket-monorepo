import config from '../config';
import { initSentry, featureFlagTraceSampler } from '@pocket-tools/sentry';
import { getClient } from '../featureFlags';

const unleash = getClient();
// Initialize sentry
initSentry({
  ...config.sentry,
  tracesSampler: featureFlagTraceSampler(unleash, config.sentry.samplerFlag),
  debug: config.sentry.environment === 'development',
});

import { serverLogger } from '@pocket-tools/ts-logger';
import { startServer } from './apollo';

startServer(config.app.port).then(() => {
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.port}`,
  );
});
