import * as Sentry from '@sentry/node';
import { config } from '../config';
import { startServer } from '../server/serverUtils';
import { serverLogger } from '@pocket-tools/ts-logger';

// Initialize sentry
Sentry.init({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

startServer(4000).then(({ app, url }) => {
  serverLogger.info(`🚀 Public server ready at http://localhost:4000`);
});
