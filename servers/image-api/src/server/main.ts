//this must run before all imports and server start
//so open-telemetry can patch all libraries that we use
import { nodeSDKBuilder } from '@pocket-tools/apollo-utils';
import config from '../config';

nodeSDKBuilder({
  host: config.tracing.host,
  serviceName: config.tracing.serviceName,
  release: config.sentry.release,
}).then(async () => {
  await startServer(config.app.serverPort);
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.serverPort}`,
  );
});

import { startServer } from './apollo';
import { serverLogger } from './logger';
