import express, { Application, json } from 'express';
import { Server, createServer } from 'http';
import { config } from '../config';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefs } from './typeDefs';
import { resolvers } from '../resolvers';
import { createApollo4QueryValidationPlugin } from 'graphql-constraint-directive/apollo4';
import { schema } from './schema';
import { ContextManager, getContextFactory } from './context';
import {
  defaultPlugins,
  errorHandler,
  initSentry,
  sentryPocketMiddleware,
} from '@pocket-tools/apollo-utils';
import * as Sentry from '@sentry/node';
import { setMorgan, serverLogger } from '@pocket-tools/ts-logger';
import { router as batchDeleteRouter } from '../server/routes/batchDelete';
import { router as userItemsDeleteRouter } from '../server/routes/userItemsDelete';

import { knexDbClient } from '../datasource/clients/knexClient';

/**
 * Create and start the apollo server.
 */
export async function startServer(port: number): Promise<{
  app: Application;
  server: ApolloServer<ContextManager>;
  url: string;
}> {
  const app = express();
  const httpServer: Server = createServer(app);

  initSentry(app, {
    ...config.sentry,
    debug: config.sentry.environment == 'development',
  });

  const server = new ApolloServer<any>({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    plugins: [
      ...defaultPlugins(httpServer),
      createApollo4QueryValidationPlugin({ schema }),
    ],
    formatError: errorHandler,
    introspection: true,
  });

  await server.start();

  // RequestHandler creates a separate execution context, so that all
  // transactions/spans/breadcrumbs are isolated across requests
  app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  // Expose health check url
  app.get('/.well-known/apollo/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  // Apply to root
  const url = '/graphql';

  const dbClient = knexDbClient();

  app.use(
    url,
    // JSON parser to enable POST body with JSON
    json(),
    setMorgan(serverLogger),
    sentryPocketMiddleware,
    expressMiddleware(server, {
      context: async ({ req }) => getContextFactory(req, dbClient),
    }),
  );
  app.use(json());
  // Batch delete route
  app.use('/batchDelete', batchDeleteRouter);

  // User items delete route
  app.use('/userItemsDelete', userItemsDeleteRouter);

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, server, url };
}
