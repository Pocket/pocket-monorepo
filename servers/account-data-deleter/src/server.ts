import express, { Application, json } from 'express';
import {
  queueDeleteRouter,
  stripeDeleteRouter,
  revokeFxaRouter,
} from './routes';
import { EventEmitter } from 'events';
import {
  BatchDeleteHandler,
  ExportListHandler,
  ImportListHandler,
} from './queueHandlers';
import { serverLogger, setMorgan } from '@pocket-tools/ts-logger';
import { sentryPocketMiddleware } from '@pocket-tools/apollo-utils';
import { unleash } from './unleash';
import { Server, createServer } from 'http';
import * as Sentry from '@sentry/node';
import { ExportStateHandler } from './queueHandlers/exportStateHandler';
import { ExportAnnotationsHandler } from './queueHandlers/exportAnnotationsHandler';

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
  app.use('/revokeFxa', revokeFxaRouter);

  Sentry.setupExpressErrorHandler(app);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));

  // Start queue handlers (background polling)
  new BatchDeleteHandler(new EventEmitter());
  new ExportListHandler(new EventEmitter());
  new ImportListHandler(new EventEmitter());
  new ExportStateHandler(new EventEmitter());
  new ExportAnnotationsHandler(new EventEmitter());

  return { server: httpServer, app };
}
