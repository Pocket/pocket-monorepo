//this must run before all imports and server start
//so open-telemetry can patch all libraries that we use
import {
  AdditionalInstrumentation,
  nodeSDKBuilder,
} from '@pocket-tools/tracing';
import config from './config';
import { serverLogger } from '@pocket-tools/ts-logger';

nodeSDKBuilder({
  host: config.tracing.host,
  serviceName: config.tracing.serviceName,
  release: config.sentry.release,
  logger: serverLogger,
  additionalInstrumentations: [AdditionalInstrumentation.KNEX],
}).then(async () => {
  const { url } = await startServer(config.app.port);
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.port}${url}`,
  );
});

import { startServer } from './apollo';
