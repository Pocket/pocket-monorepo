//this must run before all imports and server start
//so open-telemetry can patch all libraries that we use
import { nodeSDKBuilder } from './tracing';
import { startServer, serverLogger } from './server';

nodeSDKBuilder().then(async () => {
  await startServer(4001);
  serverLogger.info(`🚀 Server ready at http://localhost:4001`);
});
