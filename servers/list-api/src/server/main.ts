//this must run before all imports and server start
//so open-telemetry can patch all libraries that we use
import { nodeSDKBuilder } from './tracing';

nodeSDKBuilder().then(async () => {
  await startServer(4005);
  serverLogger.info(`🚀 Public server ready at http://localhost:4005`);
});

import { startServer } from './apollo';
import { serverLogger } from './logger';
