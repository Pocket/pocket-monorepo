import { config } from './config';
import { initSentry } from '@pocket-tools/sentry';

// Init sentry MUST come before any other imports for auto instrumentation to kick in (request isolation)
initSentry({
  ...config.sentry,
  skipOpenTelemetrySetup: true,
  integrations(integrations) {
    return integrations.filter((integration) => {
      return integration.name !== 'NodeFetch';
    });
  },
});

import { nodeSDKBuilder } from '@pocket-tools/tracing';
import { unleash } from './unleash';
nodeSDKBuilder({ ...config.tracing, unleash: unleash() }).then(async () => {
  const { server } = await startServer(config.app.port);
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.port}`,
  );

  // Schedule max uptime restart (24 hours)
  const MAX_UPTIME = 24 * 60 * 60 * 1000;
  setTimeout(() => {
    serverLogger.info('Max uptime reached, initiating graceful shutdown');
    gracefulShutdown('MAX_UPTIME_REACHED', server);
  }, MAX_UPTIME);
});
import { serverLogger } from '@pocket-tools/ts-logger';
import { startServer, gracefulShutdown } from './server';
