import * as Sentry from '@sentry/node';
import { initSentry } from '@pocket-tools/sentry';
import express, { Application, json, urlencoded } from 'express';
import config from './config/index.js';
import {
  clientErrorHandler,
  logAndCaptureErrors,
  sourceHeaderHandler,
} from './middleware/index.js';
import { Server, createServer } from 'http';

import v3GetRouter from './routes/v3Get.js';
import v3AddRouter from './routes/v3Add.js';
import v3FetchRouter from './routes/v3Fetch.js';
import v3SendRouter from './routes/v3Send.js';

export async function startServer(port: number) {
  const app: Application = express();
  const httpServer: Server = createServer(app);

  // Sentry Setup
  initSentry(app, {
    ...config.sentry,
    debug: config.sentry.environment == 'development',
  });

  // RequestHandler creates a separate execution context, so that all
  // transactions/spans/breadcrumbs are isolated across requests
  app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.set('query parser', 'simple');
  app.get('/.well-known/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  app.use(sourceHeaderHandler);

  // register public API routes
  app.use('/v3/get', v3GetRouter);
  app.use('/v3/add', v3AddRouter);
  app.use('/v3/fetch', v3FetchRouter);
  app.use('/v3/send', v3SendRouter);

  // Error handling middleware (must be defined last)
  app.use(logAndCaptureErrors);
  app.use(clientErrorHandler);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { server: httpServer, app };
}
