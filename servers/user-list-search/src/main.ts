import { config } from './config';
import { initSentry } from '@pocket-tools/sentry';
initSentry({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

import { serverLogger } from '@pocket-tools/ts-logger';
import { startServer } from './server/serverUtils';
import { unleash } from './datasource/clients';

unleash();

startServer(config.app.port).then(({ url }) => {
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.port}${url}`,
  );
});
