import { start } from './index.js';
import config from './config/index.js';

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
