import config from './config';
import { initSentry } from '@pocket-tools/sentry';
import { serverLogger } from '@pocket-tools/ts-logger';

// Initialize sentry
initSentry({
  ...config.sentry,
  debug: config.sentry.environment === 'development',
});

import { start } from './';
start(config.app.port)
  .then(({ graphqlUrl }) => {
    serverLogger.info(
      `🚀 Unleash server ready at http://localhost:${config.app.port}`,
    );
    serverLogger.info(
      `🚀 GraphQL server ready at http://localhost:${config.app.port}${graphqlUrl}`,
    );
  })
  .catch((error) => serverLogger.error(`Something went wrong: \n${error}`));
