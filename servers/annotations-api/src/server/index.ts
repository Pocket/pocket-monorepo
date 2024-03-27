import * as Sentry from '@sentry/node';
import express, { Application, json } from 'express';
import { Server, createServer } from 'http';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import {
  errorHandler,
  defaultPlugins,
  sentryPocketMiddleware,
} from '@pocket-tools/apollo-utils';
import { initSentry } from '@pocket-tools/sentry';
import { createApollo4QueryValidationPlugin } from 'graphql-constraint-directive/apollo4';

import { schema } from './apollo';
import config from '../config';
import { getContext, IContext } from '../context';
import queueDeleteRouter from './routes/queueDelete';
import { setMorgan, serverLogger } from '@pocket-tools/ts-logger';

export async function startServer(port: number): Promise<{
  app: Application;
  server: ApolloServer<IContext>;
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

  // expose a health check url
  app.get('/.well-known/apollo/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  app.use(
    // JSON parser to enable POST body with JSON
    json(),
    // JSON parser to enable POST body with JSON
    setMorgan(serverLogger),
  );
  app.use('/queueDelete', queueDeleteRouter);

  const server = new ApolloServer<IContext>({
    schema,
    plugins: [
      ...defaultPlugins(httpServer),
      createApollo4QueryValidationPlugin(),
    ],
    formatError: config.app.environment !== 'test' ? errorHandler : undefined,
  });

  await server.start();

  // graphql endpoint is at server base route
  const url = '/';

  app.use(
    url,
    cors<cors.CorsRequest>(),
    sentryPocketMiddleware,
    expressMiddleware<IContext>(server, {
      context: getContext,
    }),
  );

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, server, url };
}
