import * as Sentry from '@sentry/node';
import express, { json } from 'express';
import http from 'http';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServer, ApolloServerPlugin } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import {
  ApolloServerPluginInlineTraceDisabled,
  ApolloServerPluginUsageReportingDisabled,
} from '@apollo/server/plugin/disabled';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefs } from './typeDefs';
import { resolvers } from '../resolvers';
import { ContextManager } from './context';
import {
  sentryPlugin,
  errorHandler,
  isSubgraphIntrospection,
  isIntrospection,
} from '@pocket-tools/apollo-utils';
import { setMorgan, serverLogger } from '@pocket-tools/ts-logger';
import config from '../config';

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
  app: express.Express;
  server: ApolloServer<ContextManager>;
  url: string;
}> {
  const app = express();

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
    ],
  });

  // Our httpServer handles incoming requests to our Express app.
  // Below, we tell Apollo Server to "drain" this httpServer,
  // enabling our servers to shut down gracefully.
  const httpServer = http.createServer(app);

  // Expose health check url
  app.get('/.well-known/apollo/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  // Set up plugins depending on environment
  // Default plugins regardless
  const defaultPlugins = [
    sentryPlugin,
    ApolloServerPluginUsageReportingDisabled(),
    ApolloServerPluginDrainHttpServer({ httpServer }),
    ApolloServerPluginLandingPageLocalDefault({ footer: false }),
  ];
  // Environment-specific plugins map
  const pluginsConfig: Record<
    'test' | 'production' | 'development',
    ApolloServerPlugin[]
  > = {
    test: [ApolloServerPluginInlineTraceDisabled()],
    development: [
      ApolloServerPluginInlineTrace({ includeErrors: { unmodified: true } }),
    ],
    production: [
      ApolloServerPluginInlineTrace({
        includeErrors: { unmodified: true },
      }),
    ],
  };

  const plugins = [
    ...defaultPlugins,
    ...(pluginsConfig[process.env.NODE_ENV] ?? []),
  ];

  const server = new ApolloServer<ContextManager>({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    plugins,
    formatError: process.env.NODE_ENV !== 'test' ? errorHandler : undefined,
    introspection: true,
  });

  await server.start();

  // RequestHandler creates a separate execution context, so that all
  // transactions/spans/breadcrumbs are isolated across requests
  app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);

  // Apply to root
  const url = '/';

  app.use(
    url,
    // JSON parser to enable POST body with JSON
    json(),
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
