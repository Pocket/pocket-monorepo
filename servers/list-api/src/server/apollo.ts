import * as Sentry from '@sentry/node';
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
import { createApollo4QueryValidationPlugin } from 'graphql-constraint-directive/apollo4';
import { schema } from './schema';
import { setMorgan, serverLogger } from '@pocket-tools/ts-logger';
import * as unleash from '../featureFlags';

export async function startServer(port: number): Promise<{
  app: Application;
  server: ApolloServer<ContextManager>;
  url: string;
}> {
  // initialize express with exposed httpServer so that it may be
  // provided to drain plugin for graceful shutdown.
  const app: Application = express();
  const httpServer: Server = createServer(app);

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
    return new ContextManager({
      request: req,
      writeClient: writeClient(),
      readClient: readClient(),
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
  Sentry.setupExpressErrorHandler(app);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, server, url };
}
