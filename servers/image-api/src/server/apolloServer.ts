import { ApolloServer } from 'apollo-server-express';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefs } from './typeDefs';
import { resolvers } from '../resolvers';
import { ContextManager } from './context';
import { Request } from 'express';
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginInlineTraceDisabled,
  ApolloServerPluginInlineTrace,
  ApolloServerPluginUsageReportingDisabled,
  ApolloServerPluginCacheControl,
} from 'apollo-server-core';
import { sentryPlugin, errorHandler } from '@pocket-tools/apollo-utils';
import { getRedisCache } from '../cache';

// Function signature for context creator; primarily for
// injecting test contexts
interface ContextFactory {
  (req: Request): ContextManager;
}

/**
 * Context factory function. Creates a new context upon
 * every request
 * @param req server request
 * @returns ContextManager
 */
export function getContext(req: Request): ContextManager {
  return new ContextManager({
    request: req,
  });
}

/**
 * Sets up and configures an ApolloServer for the application.
 * @param contextFactory function for creating the context with
 * every request
 * @returns ApolloServer
 */
export function getServer(contextFactory: ContextFactory): ApolloServer {
  const defaultPlugins = [
    // Set a default cache control of 0 seconds so it respects the individual set cache controls on the schema
    // With this set to 0 it will not cache by default
    ApolloServerPluginCacheControl({
      defaultMaxAge: 0,
    }),
  ];
  const prodPlugins = [
    ApolloServerPluginLandingPageDisabled(),
    ApolloServerPluginInlineTrace(),
    sentryPlugin,
  ];
  const nonProdPlugins = [
    ApolloServerPluginLandingPageGraphQLPlayground(),
    ApolloServerPluginInlineTraceDisabled(),
    // Usage reporting is enabled by default if you have APOLLO_KEY in your environment
    ApolloServerPluginUsageReportingDisabled(),
  ];
  const plugins =
    process.env.NODE_ENV === 'production'
      ? defaultPlugins.concat(prodPlugins)
      : defaultPlugins.concat(nonProdPlugins);

  const cache = getRedisCache();
  return new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    cache,
    plugins,
    persistedQueries: {
      cache,
      ttl: 300, // 5 minutes
    },
    formatError: errorHandler,
    // Enable schema introspection so that GraphQL Codegen can generate types
    // that are used by Apollo Client in frontend apps
    introspection: true,
    context: ({ req }) => contextFactory(req),
  });
}

/**
 * Create and start the apollo server. Required to await server.start()
 * before applying middleware per apollo-server 3 migration.
 */
export async function startServer(
  contextFactory: ContextFactory,
): Promise<ApolloServer> {
  const server = getServer(contextFactory);
  await server.start();
  return server;
}
