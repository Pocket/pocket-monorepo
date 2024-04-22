import * as Sentry from '@sentry/node';
import express, { Application, json } from 'express';
import { Server, createServer } from 'http';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import {
  defaultPlugins,
  errorHandler,
  sentryPocketMiddleware,
} from '@pocket-tools/apollo-utils';
import { initSentry } from '@pocket-tools/sentry';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
import { typeDefs } from './typeDefs';
import { resolvers } from './resolvers';
import config from '../config';
import { getRedis, getRedisCache } from '../cache';
import { ParserAPI } from '../datasources/parserApi';
import { LegacyDataSourcesPlugin } from '../datasources/legacyDataSourcesPlugin';
import { ContextManager, IContext } from './context';
import { setMorgan, serverLogger } from '@pocket-tools/ts-logger';
import { unleash } from '../unleash';

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

  // Initialize unleash client
  unleash();

  // RequestHandler creates a separate execution context, so that all
  // transactions/spans/breadcrumbs are isolated across requests
  app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  const cache = getRedisCache();

  // set keepAliveTimeout and headersTimeout to values greater than ALB default (which is 60 seconds)
  httpServer.keepAliveTimeout = 60 * 1000 + 1000;
  httpServer.headersTimeout = 60 * 1000 + 2000;

  // expose a health check url
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

  const server = new ApolloServer<IContext>({
    schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
    persistedQueries: {
      cache,
      ttl: 300, // 5 minutes
    },
    introspection: true,
    cache,
    plugins: [
      ...defaultPlugins(httpServer),
      // TODO: remove once dataSources has been migrated to context
      LegacyDataSourcesPlugin({
        dataSources: () => {
          return {
            parserAPI: new ParserAPI(),
          };
        },
      }),
      // Set a default cache control of 0 seconds so it respects the individual set cache controls on the schema
      // With this set to 0 it will not cache by default
      ApolloServerPluginCacheControl({
        defaultMaxAge: 0,
      }),
    ],
    formatError: process.env.NODE_ENV !== 'test' ? errorHandler : undefined,
  });

  await server.start();

  // Apply to root
  const url = '/';

  // Simple sentry middleware for context attribution
  app.use(sentryPocketMiddleware);

  app.use(
    url,
    cors<cors.CorsRequest>(),
    // JSON parser to enable POST body with JSON
    json(),
    sentryPocketMiddleware,
    // Logging Setup, Express app-specific
    setMorgan(serverLogger),
    expressMiddleware(server, {
      context: async ({ req }) =>
        await ContextManager.initialize({ headers: req.headers }),
    }),
  );

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, server, url };
}
