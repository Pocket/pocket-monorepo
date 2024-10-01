import config from './config';
import { initSentry, featureFlagTraceSampler } from '@pocket-tools/sentry';
import { unleash } from './unleash';

const unleashClient = unleash();
initSentry({
  ...config.sentry,
  tracesSampler: featureFlagTraceSampler(
    unleashClient,
    config.sentry.samplerFlag,
  ),
  debug: config.sentry.environment === 'development',
});

import { serverLogger } from '@pocket-tools/ts-logger';
import { startServer } from './server';

startServer(config.app.port).then(() => {
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.port}`,
  );
});
