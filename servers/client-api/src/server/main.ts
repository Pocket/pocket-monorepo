//this must run before all imports and server start
//so open-telemetry can patch all libraries that we use
import { nodeSDKBuilder } from './tracing';

nodeSDKBuilder().then(async () => {
  await startExpressServer(4000);
  serverLogger.info(`🚀 Server ready at http://localhost:4000`);
});

import { serverLogger, startExpressServer } from './express';
