import * as Sentry from '@sentry/node';
import express, { Application, json } from 'express';
import { Server, createServer } from 'http';
import { setMorgan, serverLogger } from '@pocket-tools/ts-logger';

import { sentryPocketMiddleware } from '@pocket-tools/apollo-utils';

export async function startServer(port: number): Promise<{
  app: Application;
  url: string;
}> {
  // initialize express with exposed httpServer so that it may be
  // provided to drain plugin for graceful shutdown.
  const app: Application = express();
  const httpServer: Server = createServer(app);

  // Expose health check url
  app.get('/health', (req, res) => {
    res.status(200).send('ok');
  });

  // Apply to root
  const url = '/';

  app.use(
    // JSON parser to enable POST body with JSON
    json(),
    sentryPocketMiddleware,
    setMorgan(serverLogger),
  );

  // The error handler must be before any other error middleware and after all controllers
  Sentry.setupExpressErrorHandler(app);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, url };
}
