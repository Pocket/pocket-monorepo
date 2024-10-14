import config from '../config';
import { initSentry } from '@pocket-tools/sentry';

// Init sentry MUST come before any other imports for auto instrumentation to kick in (request isolation)
initSentry({
  ...config.sentry,
  skipOpenTelemetrySetup: true,
  // Bug in Sentry SDK causes NodeFetch to add extra trace headers, Sentry is looking into it.
  integrations(integrations) {
    return integrations.filter((integration) => {
      return integration.name !== 'NodeFetch';
    });
  },
  debug: config.sentry.environment === 'development',
});

import { nodeSDKBuilder } from '@pocket-tools/tracing';
import { getClient } from '../featureFlags';
nodeSDKBuilder({ ...config.tracing, unleash: getClient() }).then(() => {
  startServer(config.app.port).then(() => {
    serverLogger.info(
      `🚀 Public server ready at http://localhost:${config.app.port}`,
    );
  });
});
import { serverLogger } from '@pocket-tools/ts-logger';
import { startServer } from './apollo';
