import { errorHandler, sentryPlugin } from '@pocket-tools/apollo-utils';
import { ApolloServer, ApolloServerPlugin } from '@apollo/server';
import { ApolloServerPluginLandingPageGraphQLPlayground } from '@apollo/server-plugin-landing-page-graphql-playground';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginInlineTraceDisabled,
  ApolloServerPluginUsageReportingDisabled,
} from '@apollo/server/plugin/disabled';
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
import responseCachePlugin from '@apollo/server-plugin-response-cache';
import { createApollo4QueryValidationPlugin } from 'graphql-constraint-directive/apollo4';
import { Server } from 'http';

import { IPublicContext } from './context';
import config from '../config';
import { getRedisCache } from '../cache';
import { schema } from './schema';

export function getPublicServer(
  httpServer: Server
): ApolloServer<IPublicContext> {
  const cache = getRedisCache();

  const defaultPlugins = [
    // On initialization, this plugin automatically begins caching responses according to field settings
    // see shareableListPublic cache control settings
    responseCachePlugin(),
    sentryPlugin,
    ApolloServerPluginDrainHttpServer({ httpServer }),
    ApolloServerPluginCacheControl({
      // Let's set the default max age to 0 so that no query responses get cached by default
      // and we will specify the max age for specific queries on the schema and resolver level
      defaultMaxAge: config.app.defaultMaxAge,
    }),
    ApolloServerPluginUsageReportingDisabled(),
    createApollo4QueryValidationPlugin({
      schema,
    }),
  ];

  // map of plugins for each node environment
  const environmentPlugins: Record<
    'test' | 'development' | 'production',
    ApolloServerPlugin[]
  > = {
    test: [ApolloServerPluginInlineTraceDisabled()],
    development: [
      ApolloServerPluginLandingPageGraphQLPlayground(),
      ApolloServerPluginInlineTrace({ includeErrors: { unmodified: true } }),
    ],
    production: [
      ApolloServerPluginLandingPageDisabled(),
      ApolloServerPluginInlineTrace({ includeErrors: { unmodified: true } }),
    ],
  };

  // combine default plugins with environment specific plugins for this server
  // instance
  const plugins = defaultPlugins.concat(
    environmentPlugins[process.env.NODE_ENV] ?? []
  );

  return new ApolloServer<IPublicContext>({
    schema,
    plugins,
    cache,
    formatError: errorHandler,
  });
}

export async function startPublicServer(
  httpServer: Server
): Promise<ApolloServer<IPublicContext>> {
  const server = getPublicServer(httpServer);
  await server.start();
  return server;
}
