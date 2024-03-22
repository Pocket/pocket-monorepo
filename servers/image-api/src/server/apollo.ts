import * as Sentry from '@sentry/node';
import express, { json, Application } from 'express';
import { Server, createServer } from 'http';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefs } from './typeDefs';
import { resolvers } from '../resolvers';
import { ContextManager } from './context';
import {
  errorHandler,
  isSubgraphIntrospection,
  isIntrospection,
  defaultPlugins,
  sentryPocketMiddleware,
} from '@pocket-tools/apollo-utils';
import { initSentry } from '@pocket-tools/sentry';
import { setMorgan, serverLogger } from '@pocket-tools/ts-logger';
import config from '../config';
import { getRedis } from '../cache';

/**
 * Context factory function. Creates a new context upon
 * every request
 * @param req server request
 * @returns ContextManager
 */
const contextFactory = (req: express.Request) => {
  if (
    isIntrospection(req.body.query) ||
    isSubgraphIntrospection(req.body.query)
  ) {
    // Bypass context function throwing auth errors) for introspection
    return null;
  }

  return new ContextManager({
    request: req,
  });
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

  // RequestHandler creates a separate execution context, so that all
  // transactions/spans/breadcrumbs are isolated across requests
  app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  // Expose health check url
  app.get('/.well-known/apollo/server-health', async (req, res) => {
    // Check redis can connect
    try {
      const redis = getRedis();
      await redis.set('test', true, 1);
    } catch (error) {
      res.status(500).send('cache error');
      serverLogger.error(error);
      return;
    }
    res.status(200).send('ok');
  });

  const server = new ApolloServer<ContextManager>({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    plugins: defaultPlugins(httpServer),
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
  app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, server, url };
}
