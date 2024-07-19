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
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
import { typeDefs } from './typeDefs';
import { resolvers } from './resolvers';
import { getRedis, getRedisCache } from '../cache';
import { ContextManager, IContext } from './context';
import { setMorgan, serverLogger } from '@pocket-tools/ts-logger';
import { unleash } from '../unleash';
import config from '../config';

export async function startServer(port: number): Promise<{
  app: Application;
  server: ApolloServer<IContext>;
  url: string;
}> {
  // initialize express with exposed httpServer so that it may be
  // provided to drain plugin for graceful shutdown.
  const app: Application = express();
  const httpServer: Server = createServer(app);

  // Initialize unleash client
  unleash();

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
    json({ limit: config.app.maxRequestSize }),
    sentryPocketMiddleware,
    // Logging Setup, Express app-specific
    setMorgan(serverLogger),
    expressMiddleware(server, {
      context: async ({ req }) =>
        await ContextManager.initialize({ headers: req.headers }),
    }),
  );

  // The error handler must be before any other error middleware and after all controllers
  Sentry.setupExpressErrorHandler(app);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, server, url };
}
