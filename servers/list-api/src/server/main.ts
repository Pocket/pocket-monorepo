import config from '../config';
import { initSentry } from '@pocket-tools/sentry';
// Initialize sentry
initSentry({
  ...config.sentry,
  tracesSampleRate: 0.01,
  debug: config.sentry.environment === 'development',
});

import { serverLogger } from '@pocket-tools/ts-logger';
import { startServer } from './apollo';

startServer(config.app.port).then(() => {
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.port}`,
  );
});
