import { config } from './config';
import { initSentry } from '@pocket-tools/sentry';
initSentry({
  ...config.sentry,
});
import { serverLogger } from '@pocket-tools/ts-logger';
import { startServer } from './server';

//this must run before all imports and server start but after sentry
//so open-telemetry can patch all libraries that we use
startServer(config.app.port).then(() => {
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.port}`,
  );
});
