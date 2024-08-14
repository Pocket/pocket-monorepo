import config from '../config';
import { initSentry } from '@pocket-tools/sentry';
// Initialize sentry
initSentry({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

import { startServer } from './apollo';
import { serverLogger } from '@pocket-tools/ts-logger';

startServer(config.app.serverPort).then(() => {
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.serverPort}`,
  );
});

