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
import { createApollo4QueryValidationPlugin } from 'graphql-constraint-directive/apollo4';

import { schema } from './schema/buildSchema';
import { config } from '../config';
import { getContext, IContext } from './context';
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

  // expose a health check url
  app.get('/.well-known/apollo/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  app.use(
    // JSON parser to enable POST body with JSON
    json(),
    sentryPocketMiddleware,
    // JSON parser to enable POST body with JSON
    setMorgan(serverLogger),
  );

  const server = new ApolloServer<IContext>({
    schema,
    plugins: [
      ...defaultPlugins(httpServer),
      createApollo4QueryValidationPlugin({ schema }),
    ],
    formatError: config.app.environment !== 'test' ? errorHandler : undefined,
  });

  await server.start();

  // graphql endpoint is at server base route
  const url = '/';

  app.use(
    url,
    cors<cors.CorsRequest>(),
    expressMiddleware<IContext>(server, {
      context: getContext,
    }),
  );

  // The error handler must be before any other error middleware and after all controllers
  Sentry.setupExpressErrorHandler(app);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, server, url };
}
