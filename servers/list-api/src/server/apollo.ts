import express, { Application, json } from 'express';
import { Server, createServer } from 'http';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServer } from '@apollo/server';
import {
  defaultPlugins,
  errorHandler,
  isIntrospection,
  isSubgraphIntrospection,
  sentryPocketMiddleware,
} from '@pocket-tools/apollo-utils';
import { initSentry, initSentryErrorHandler } from '@pocket-tools/sentry';
import config from '../config';
import { ContextManager } from './context';
import { readClient, writeClient } from '../database/client';
import {
  eventBridgeEventHandler,
  initItemEventHandlers,
  itemsEventEmitter,
  snowplowEventHandler,
  sqsEventHandler,
  unifiedEventHandler,
} from '../businessEvents';
import { Knex } from 'knex';
import { createApollo4QueryValidationPlugin } from 'graphql-constraint-directive/apollo4';
import { schema } from './schema';
import { setMorgan, serverLogger } from '@pocket-tools/ts-logger';
import * as unleash from '../featureFlags';

/**
 * Stopgap method to set global db connection in context,
 * depending on whether the request is a query or mutation.
 * It's not possible to run both a mutation and query at the
 * same time according to the graphql spec.
 * This is a fragile regex which depends on the `mutation` keyword
 * being present or not at the beginning of the request
 * (part of the graphql request spec).
 * This method should just be used in the context factory function
 * but is exported from this file for unit testing.
 * @param query a graphql request body
 * @returns either a read or write connection to the database,
 * depending on if query or mutation.
 */
export const contextConnection = (query: string): Knex => {
  const isMutationRegex = /^[\n\r\s]*(mutation)/;
  const isMutation = isMutationRegex.test(query);
  return isMutation ? writeClient() : readClient();
};

export async function startServer(port: number): Promise<{
  app: Application;
  server: ApolloServer<ContextManager>;
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

  // Expose health check url
  app.get('/.well-known/apollo/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  // Initialize event handlers
  initItemEventHandlers(itemsEventEmitter, [
    unifiedEventHandler,
    sqsEventHandler,
    snowplowEventHandler,
    eventBridgeEventHandler,
  ]);

  // Start unleash client
  const unleashClient = unleash.getClient();

  // Inject initialized event emittter to create context factory function
  const contextFactory = (req: express.Request) => {
    if (
      isIntrospection(req.body.query) ||
      isSubgraphIntrospection(req.body.query)
    ) {
      // Bypass auth (ie, the userId() function throwing auth errors) for introspection
      return null;
    }
    const dbClient = contextConnection(req.body.query);
    return new ContextManager({
      request: req,
      dbClient,
      eventEmitter: itemsEventEmitter,
      unleash: unleashClient,
    });
  };

  const server = new ApolloServer<ContextManager>({
    schema,
    plugins: [
      ...defaultPlugins(httpServer),
      createApollo4QueryValidationPlugin({ schema }),
    ],
    formatError: process.env.NODE_ENV !== 'test' ? errorHandler : undefined,
    introspection: true,
  });

  await server.start();

  // Apply to root
  const url = '/';

  app.use(
    url,
    // JSON parser to enable POST body with JSON
    json(),
    sentryPocketMiddleware,
    setMorgan(serverLogger),
    expressMiddleware(server, {
      context: async ({ req }) => contextFactory(req),
    }),
  );

  // The error handler must be before any other error middleware and after all controllers
  initSentryErrorHandler(app);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, server, url };
}
