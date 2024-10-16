import express, { Application, json } from 'express';
import { queueDeleteRouter, stripeDeleteRouter } from './routes';
import { EventEmitter } from 'events';
import { BatchDeleteHandler, ExportListHandler } from './queueHandlers';
import { serverLogger, setMorgan } from '@pocket-tools/ts-logger';
import { sentryPocketMiddleware } from '@pocket-tools/apollo-utils';
import { unleash } from './unleash';
import { Server, createServer } from 'http';
import * as Sentry from '@sentry/node';

export async function startServer(port: number): Promise<{
  server: Server;
  app: Application;
}> {
  const app: Application = express();
  const httpServer: Server = createServer(app);

  // Initialize unleash client
  unleash();

  app.use(
    // JSON parser to enable POST body with JSON
    json(),
    sentryPocketMiddleware,
    // Logging Setup, Express app-specific
    setMorgan(serverLogger),
  );

  // Endpoints
  app.get('/health', (req, res) => {
    res.status(200).send('ok');
  });
  app.use('/queueDelete', queueDeleteRouter);
  app.use('/stripeDelete', stripeDeleteRouter);

  Sentry.setupExpressErrorHandler(app);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));

  // Start batch delete event handler
  new BatchDeleteHandler(new EventEmitter());
  new ExportListHandler(new EventEmitter());

  return { server: httpServer, app };
}
