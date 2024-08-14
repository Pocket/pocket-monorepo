import config from '../config';
import { initSentry } from '@pocket-tools/sentry';
// Initialize sentry
initSentry({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

import { serverLogger } from '@pocket-tools/ts-logger';
startServer(config.app.port).then(() => {
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.port}`,
  );
});

import { startServer } from './apollo';
