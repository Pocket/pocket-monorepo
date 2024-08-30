import { config } from './config';
import { initSentry } from '@pocket-tools/sentry';
initSentry({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});
import { serverLogger } from '@pocket-tools/ts-logger';
import { startServer } from './apollo/server';

startServer(config.app.port).then(() => {
  serverLogger.info(`🚀 Server ready at http://localhost:${config.app.port}`);
});
