import * as Sentry from '@sentry/node';
import config from './config';
import express from 'express';
import { getServer } from './server';
import { expressMiddleware } from '@apollo/server/express4';
import { ContextFactory } from './context';
import { readClient, writeClient } from './database/client';
import { userEventEmitter } from './events/init';
import http from 'http';
import { setMorgan } from '@pocket-tools/ts-logger';
import { serverLogger } from './logger';

export async function startServer(port: number) {
  // initialize express with exposed httpServer so that it may be
  // provided to drain plugin for graceful shutdown.
  const app = express();
  const httpServer = http.createServer(app);

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

  const server = getServer(httpServer);
  const url = '/';

  //Apply the GraphQL middleware into the express app
  await server.start();

  // RequestHandler creates a separate execution context, so that all
  // transactions/spans/breadcrumbs are isolated across requests
  app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);

  // expose a health check url
  app.get('/.well-known/apollo/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  app.use(
    url,
    express.json(),
    setMorgan(serverLogger),
    expressMiddleware(server, {
      context: async ({ req }) =>
        ContextFactory({
          request: req,
          db: {
            readClient: readClient(),
            writeClient: writeClient(),
          },
          eventEmitter: userEventEmitter,
        }),
    }),
  );

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { server, app, url };
}
