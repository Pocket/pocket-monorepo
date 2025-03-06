import config from './config';
import { initSentry } from '@pocket-tools/sentry';
// Initialize sentry
initSentry({
  ...config.sentry,
});

import { startServer } from './express';
import { serverLogger } from '@pocket-tools/ts-logger';
import { ExportHandler } from './background/ExportHandler';
import { EventEmitter } from 'events';

(async () => {
  const { adminUrl, publicUrl } = await startServer(4029);
  // Start background tasks
  new ExportHandler(new EventEmitter());
  serverLogger.info(
    `🚀 Public server ready at http://localhost:4029${publicUrl}`,
  );
  serverLogger.info(
    `🚀 Public server ready at http://localhost:4029${adminUrl}`,
  );
})();
