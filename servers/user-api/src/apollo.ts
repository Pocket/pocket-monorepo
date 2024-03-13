import * as Sentry from '@sentry/node';
import config from './config';
import express, { Application, json } from 'express';
import { getServer } from './server';
import { expressMiddleware } from '@apollo/server/express4';
import { ContextFactory } from './context';
import { readClient, writeClient } from './database/client';
import { userEventEmitter } from './events/init';
import { Server, createServer } from 'http';
import { setMorgan, serverLogger } from '@pocket-tools/ts-logger';
import { sentryPocketMiddleware } from '@pocket-tools/apollo-utils';
import { initSentry } from '@pocket-tools/sentry';

export async function startServer(port: number) {
  // initialize express with exposed httpServer so that it may be
  // provided to drain plugin for graceful shutdown.
  const app: Application = express();
  const httpServer: Server = createServer(app);

  initSentry(app, {
    ...config.sentry,
    debug: config.sentry.environment == 'development',
  });

  const server = getServer(httpServer);
  const url = '/';

  //Apply the GraphQL middleware into the express app
  await server.start();

  // RequestHandler creates a separate execution context, so that all
  // transactions/spans/breadcrumbs are isolated across requests
  app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  // expose a health check url
  app.get('/.well-known/apollo/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  app.use(
    url,
    json(),
    setMorgan(serverLogger),
    sentryPocketMiddleware,
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
