import { ApolloServer, GraphQLRequestContext } from '@apollo/server';
import { Server } from 'http';
import { sentryPlugin } from '@pocket-tools/apollo-utils';
import responseCachePlugin from '@apollo/server-plugin-response-cache';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginInlineTraceDisabled,
  ApolloServerPluginUsageReportingDisabled,
} from '@apollo/server/plugin/disabled';
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { IContext } from './context';
import { getAppGateway } from './gateway';
import { cache } from '../memcached';
import { gatewayErrorHandler } from './gatewayErrorHandler';

/**
 * Configures, initializes and returns a client-api gateway ApolloServer.
 *
 * @param httpServer Server from the http package, used to facilitate graceful shutdown
 * @returns ApolloServer<IContext>
 */
export function getServer(httpServer: Server): ApolloServer<IContext> {
  const defaultPlugins = [
    sentryPlugin,
    responseCachePlugin({
      // https://www.apollographql.com/docs/apollo-server/performance/caching/#saving-full-responses-to-a-cache
      // use userId from context as a cache key
      sessionId: async (requestContext: GraphQLRequestContext<IContext>) =>
        requestContext?.contextValue?.pocketUser?.userId ?? null,
    }),
    ApolloServerPluginDrainHttpServer({ httpServer }),
  ];
  const prodPlugins = [
    ApolloServerPluginLandingPageDisabled(),
    ApolloServerPluginInlineTrace(),
  ];
  const nonProdPlugins = [
    ApolloServerPluginLandingPageLocalDefault(),
    ApolloServerPluginInlineTraceDisabled(),
    // Usage reporting is enabled by default if you have APOLLO_KEY in your environment
    ApolloServerPluginUsageReportingDisabled(),
  ];
  const plugins =
    process.env.NODE_ENV === 'production'
      ? defaultPlugins.concat(prodPlugins)
      : defaultPlugins.concat(nonProdPlugins);

  return new ApolloServer<IContext>({
    gateway: getAppGateway(),
    csrfPrevention: true,
    // Enable schema introspection so that GraphQL Codegen can generate types
    // that are used by Apollo Client in frontend apps
    introspection: true,
    // Caches the queries that apollo clients can send via a hashed get request
    // This allows us to cache resolver decisions
    persistedQueries: {
      cache,
      ttl: 300, // 5 minutes
    },
    // The cache that Apollo should use for all of its responses
    // This will only be used if all data in the response is cacheable
    // However because up above we set cacheControl to default of 5 this is always cached for at least 5 seconds
    // This will add the CDN cache control headers to the response and will cache it in memcached if its cacheable
    cache,
    plugins,
    formatError: gatewayErrorHandler,
  });
}

/**
 * Helper, initializes an ApolloServer and starts it.
 */
export async function startServer(
  httpServer: Server
): Promise<ApolloServer<IContext>> {
  const server = getServer(httpServer);
  await server.start();
  return server;
}
