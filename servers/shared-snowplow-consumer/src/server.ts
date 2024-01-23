import * as Sentry from '@sentry/node';
import express, { json } from 'express';
import http from 'http';
import { config } from './config';
import { setMorgan, serverLogger } from '@pocket-tools/ts-logger';

import { EventEmitter } from 'events';
import { SqsConsumer } from './SqsConsumer';

export async function startServer(port: number): Promise<{
  app: express.Express;
  url: string;
}> {
  const app = express();

  Sentry.init({
    ...config.sentry,
    debug: config.sentry.environment == 'development',
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Sentry.Integrations.Express({
        // to trace all requests to the default router
        app,
      }),
    ],
  });

  // Start polling for messages from snowplow event queue
  new SqsConsumer(new EventEmitter());

  // Our httpServer handles incoming requests to our Express app.
  // Below, we tell Apollo Server to "drain" this httpServer,
  // enabling our servers to shut down gracefully.
  const httpServer = http.createServer(app);

  // Expose health check url
  app.get('/health', (req, res) => {
    res.status(200).send('ok');
  });

  // RequestHandler creates a separate execution context, so that all
  // transactions/spans/breadcrumbs are isolated across requests
  app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);

  // Apply to root
  const url = '/';

  app.use(
    // JSON parser to enable POST body with JSON
    json(),
    setMorgan(serverLogger),
  );

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, url };
}
