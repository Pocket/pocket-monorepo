import * as Sentry from '@sentry/node';
import express, { Application, json } from 'express';
import { Server, createServer } from 'http';
import { config } from './config';
import { setMorgan, serverLogger } from '@pocket-tools/ts-logger';

import { EventEmitter } from 'events';
import { SqsConsumer } from './SqsConsumer';
import { sentryPocketMiddleware } from '@pocket-tools/apollo-utils';
import { initSentry } from '@pocket-tools/sentry';

export async function startServer(port: number): Promise<{
  app: Application;
  url: string;
}> {
  // initialize express with exposed httpServer so that it may be
  // provided to drain plugin for graceful shutdown.
  const app: Application = express();
  const httpServer: Server = createServer(app);

  initSentry(app, {
    ...config.sentry,
    debug: config.sentry.environment == 'development',
  });

  // RequestHandler creates a separate execution context, so that all
  // transactions/spans/breadcrumbs are isolated across requests
  app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  // Start polling for messages from snowplow event queue
  new SqsConsumer(new EventEmitter());

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
  app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, url };
}
