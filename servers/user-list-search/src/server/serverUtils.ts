import express, { Application, json } from 'express';
import { Server, createServer } from 'http';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServer } from '@apollo/server';
import { createApollo4QueryValidationPlugin } from 'graphql-constraint-directive/apollo4';
import { schema } from './schema';
import { ContextManager, getContextFactory } from './context';
import {
  defaultPlugins,
  errorHandler,
  sentryPocketMiddleware,
} from '@pocket-tools/apollo-utils';
import * as Sentry from '@sentry/node';
import { setMorgan, serverLogger } from '@pocket-tools/ts-logger';
import { router as batchDeleteRouter } from '../server/routes/batchDelete';
import { router as itemDeleteRouter } from './routes/itemDelete';
import { router as itemUpdateRouter } from './routes/itemUpdate';
import { router as userListImportRouter } from './routes/userListImport';

import { knexDbReadClient } from '../datasource/clients/knexClient';
import { unleash } from '../datasource/clients';

/**
 * Create and start the apollo server.
 */
export async function startServer(port: number): Promise<{
  app: Application;
  server: ApolloServer<ContextManager>;
  url: string;
}> {
  await unleash();

  const app = express();
  const httpServer: Server = createServer(app);

  const server = new ApolloServer<any>({
    schema,
    plugins: [
      ...defaultPlugins(httpServer),
      createApollo4QueryValidationPlugin({ schema }),
    ],
    formatError: errorHandler,
    introspection: true,
  });

  await server.start();

  // Expose health check url
  app.get('/.well-known/apollo/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  // Apply to root
  const url = '/graphql';

  const dbClient = knexDbReadClient();

  app.use(
    // JSON parser to enable POST body with JSON
    json(),
    sentryPocketMiddleware,
  );

  app.use(
    url,
    setMorgan(serverLogger),
    expressMiddleware(server, {
      context: async ({ req }) => getContextFactory(req, dbClient),
    }),
  );
  // Batch delete route
  app.use('/batchDelete', batchDeleteRouter);

  // User items delete route
  app.use('/itemDelete', itemDeleteRouter);

  // User items update route
  app.use('/itemUpdate', itemUpdateRouter);

  // User items update route
  app.use('/userListImport', userListImportRouter);

  // The error handler must be before any other error middleware and after all controllers
  Sentry.setupExpressErrorHandler(app);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, server, url };
}
