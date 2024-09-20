import config from './config';

import { initSentry } from '@pocket-tools/sentry';
// Initialize sentry
initSentry({
  ...config.sentry,
  debug: config.sentry.environment === 'development',
});

import { serverLogger } from '@pocket-tools/ts-logger';
import { startServer } from './server';

startServer(config.app.port).then(() => {
  serverLogger.info(
    `🚀 Braze Content Proxy ready at http://localhost:${config.app.port}`,
  );
});
