//this must run before all imports and server start
//so open-telemetry can patch all libraries that we use
import config from './config';
import { initSentry, featureFlagTraceSampler } from '@pocket-tools/sentry';
import { unleash } from './unleash';

const unleashClient = unleash();
// Initialize sentry
initSentry({
  ...config.sentry,
  tracesSampler: featureFlagTraceSampler(
    unleashClient,
    config.sentry.samplerFlag,
  ),
  debug: config.sentry.environment === 'development',
});
import { serverLogger } from '@pocket-tools/ts-logger';
import { startServer } from './apollo/server';

startServer(config.app.serverPort).then(({ url }) => {
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.serverPort}${url}`,
  );
});
