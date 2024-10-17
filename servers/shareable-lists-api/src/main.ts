import config from './config';
import { initSentry } from '@pocket-tools/sentry';
// Initialize sentry
initSentry({
  ...config.sentry,

});

import { startServer } from './express';
import { serverLogger } from '@pocket-tools/ts-logger';

(async () => {
  const { adminUrl, publicUrl } = await startServer(4029);
  serverLogger.info(
    `🚀 Public server ready at http://localhost:4029${publicUrl}`,
  );
  serverLogger.info(
    `🚀 Public server ready at http://localhost:4029${adminUrl}`,
  );
})();
