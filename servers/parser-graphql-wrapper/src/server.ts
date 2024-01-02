import * as Sentry from '@sentry/node';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import {
  errorHandler,
  sentryPlugin,
  sentryPocketMiddleware,
} from '@pocket-tools/apollo-utils';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginInlineTraceDisabled,
  ApolloServerPluginUsageReportingDisabled,
} from '@apollo/server/plugin/disabled';
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import { typeDefs } from './typeDefs';
import { resolvers } from './resolvers';
import config from './config';
import { getRedisCache } from './cache';
import { ParserAPI } from './datasources/parserApi';
import { LegacyDataSourcesPlugin } from './datasources/legacyDataSourcesPlugin';
import { ContextManager, IContext } from './context';
import { serverLogger } from './logger';
import { setMorgan } from '@pocket-tools/ts-logger';

export async function startServer(port: number): Promise<{
  app: Express.Application;
  server: ApolloServer<IContext>;
  url: string;
}> {
  // initialize express with exposed httpServer so that it may be
  // provided to drain plugin for graceful shutdown.
  const app = express();

  // Sentry Setup
  Sentry.init({
    ...config.sentry,
    debug: config.sentry.environment == 'development',
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Apollo(),
      // enable Express.js middleware tracing
      new Sentry.Integrations.Express({
        // to trace all requests to the default router
        app,
      }),
      new Sentry.Integrations.Mysql(),
    ],
  });

  const cache = getRedisCache();
  const httpServer = http.createServer(app);

  // set keepAliveTimeout and headersTimeout to values greater than ALB default (which is 60 seconds)
  httpServer.keepAliveTimeout = 60 * 1000 + 1000;
  httpServer.headersTimeout = 60 * 1000 + 2000;

  // expose a health check url
  app.get('/.well-known/apollo/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  const defaultPlugins = [
    // Set a default cache control of 0 seconds so it respects the individual set cache controls on the schema
    // With this set to 0 it will not cache by default
    ApolloServerPluginCacheControl({
      defaultMaxAge: 0,
    }),
    ApolloServerPluginDrainHttpServer({ httpServer }),
    // TODO: remove once dataSources has been migrated to context
    LegacyDataSourcesPlugin({
      dataSources: () => {
        return {
          parserAPI: new ParserAPI(),
        };
      },
    }),
    ApolloServerPluginUsageReportingDisabled(),
  ];
  const localPlugins = [
    ApolloServerPluginLandingPageLocalDefault({ footer: false }),
    ApolloServerPluginInlineTraceDisabled(),
  ];
  const nonProdPlugins = [
    ApolloServerPluginLandingPageLocalDefault({ footer: false }),
    ApolloServerPluginInlineTrace({ includeErrors: { unmodified: true } }),
  ];
  const prodPlugins = [
    ApolloServerPluginLandingPageDisabled(),
    ApolloServerPluginInlineTrace({ includeErrors: { unmodified: true } }),
    sentryPlugin,
  ];
  const plugins = [
    ...defaultPlugins,
    ...(process.env.NODE_ENV === 'production' ? prodPlugins : []),
    ...(process.env.NODE_ENV === 'development' ? nonProdPlugins : []),
    ...(process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'test'
      ? localPlugins
      : []),
  ];

  const server = new ApolloServer<IContext>({
    schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
    persistedQueries: {
      cache,
      ttl: 300, // 5 minutes
    },
    introspection: true,
    cache,
    plugins,
    formatError: process.env.NODE_ENV !== 'test' ? errorHandler : undefined,
  });

  await server.start();

  // RequestHandler creates a separate execution context, so that all
  // transactions/spans/breadcrumbs are isolated across requests
  app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  // Apply to root
  const url = '/';

  // Simple sentry middleware for context attribution
  app.use(sentryPocketMiddleware);

  // ContextManager is currently stateless, just provide singleton rather
  // than factory function.
  const contextManager = new ContextManager();

  app.use(
    url,
    cors<cors.CorsRequest>(),
    // JSON parser to enable POST body with JSON
    express.json(),
    // Logging Setup, Express app-specific
    setMorgan(serverLogger),
    expressMiddleware(server, {
      context: async () => contextManager,
    }),
  );

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, server, url };
}
