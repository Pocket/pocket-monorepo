import { defaultPlugins } from '@pocket-tools/apollo-utils';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
import responseCachePlugin from '@apollo/server-plugin-response-cache';
import { createApollo4QueryValidationPlugin } from 'graphql-constraint-directive/apollo4';
import { Server } from 'http';

import { IPublicContext } from './context';
import config from '../config';
import { getRedisCache } from '../cache';
import { schema } from './schema';

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
      createApollo4QueryValidationPlugin(),
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
