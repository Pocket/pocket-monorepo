//this must run before all imports and server start
//so open-telemetry can patch all libraries that we use
import config from './config';
import { initSentry } from '@pocket-tools/sentry';

// Initialize sentry
initSentry({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});
import { serverLogger } from '@pocket-tools/ts-logger';
import { startServer } from './apollo/server';

startServer(config.app.serverPort).then(({ url }) => {
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.serverPort}${url}`,
  );
});
