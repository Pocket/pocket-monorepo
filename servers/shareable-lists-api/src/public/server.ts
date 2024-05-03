import { ApolloServerPlugin, defaultPlugins } from '@pocket-tools/apollo-utils';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
import responseCachePlugin from '@apollo/server-plugin-response-cache';
import { createApollo4QueryValidationPlugin } from 'graphql-constraint-directive/apollo4.js';
import { Server } from 'http';

import { IPublicContext } from './context.js';
import config from '../config/index.js';
import { getRedisCache } from '../cache/index.js';
import { schema } from './schema.js';

export function getPublicServer(
  httpServer: Server,
): ApolloServer<IPublicContext> {
  const cache = getRedisCache();

  return new ApolloServer<IPublicContext>({
    schema,
    plugins: [
      ...defaultPlugins(httpServer),
      ApolloServerPluginCacheControl({
        // Let's set the default max age to 0 so that no query responses get cached by default
        // and we will specify the max age for specific queries on the schema and resolver level
        defaultMaxAge: config.app.defaultMaxAge,
      }),
      // https://github.com/confuser/graphql-constraint-directive/issues/188
      createApollo4QueryValidationPlugin({
        schema,
      }) as unknown as ApolloServerPlugin,
      responseCachePlugin(),
    ],
    cache,
    // formatError: errorHandler,
  });
}

export async function startPublicServer(
  httpServer: Server,
): Promise<ApolloServer<IPublicContext>> {
  const server = getPublicServer(httpServer);
  await server.start();
  return server;
}
