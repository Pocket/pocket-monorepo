import { startServer } from './express';
import { serverLogger } from './logger';

(async () => {
  const { adminUrl, publicUrl } = await startServer(4029);
  serverLogger.info(
    `🚀 Public server ready at http://localhost:4029${publicUrl}`,
  );
  serverLogger.info(
    `🚀 Public server ready at http://localhost:4029${adminUrl}`,
  );
})();
