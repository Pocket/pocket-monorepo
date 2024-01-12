import { serverLogger, startServer } from './express';

(async () => {
  const { adminUrl, publicUrl } = await startServer(4029);
  serverLogger.info(
    `🚀 Public server ready at http://localhost:4029${publicUrl}`
  );
  serverLogger.info(
    `🚀 Public server ready at http://localhost:4029${adminUrl}`
  );
})();
