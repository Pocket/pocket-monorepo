import config from './config';
import { initSentry } from '@pocket-tools/sentry';
// Initialize sentry
initSentry({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

import { start } from './';
start(config.app.port)
  .then(({ graphqlUrl }) => {
    console.log(
      `🚀 Unleash server ready at http://localhost:${config.app.port}`,
    );
    console.log(
      `🚀 GraphQL server ready at http://localhost:${config.app.port}/${graphqlUrl}`,
    );
  })
  .catch((error) => console.log(`Something went wrong: \n${error}`));
