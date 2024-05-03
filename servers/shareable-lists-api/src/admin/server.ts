import { ApolloServer } from '@apollo/server';
import { Server } from 'http';
import { ApolloServerPlugin, defaultPlugins } from '@pocket-tools/apollo-utils';
import { IAdminContext } from './context.js';
import { schema } from './schema.js';
import { createApollo4QueryValidationPlugin } from 'graphql-constraint-directive/apollo4.js';

/**
 * Sets up and configures an ApolloServer for the application.
 * contextFactory function for creating the context with every request
 *
 * @returns ApolloServer
 */
export function getAdminServer(
  httpServer: Server,
): ApolloServer<IAdminContext> {
  return new ApolloServer<IAdminContext>({
    schema,
    plugins: [
      ...defaultPlugins(httpServer),
      // https://github.com/confuser/graphql-constraint-directive/issues/188
      createApollo4QueryValidationPlugin({
        schema,
      }) as unknown as ApolloServerPlugin,
    ],
    // OSL-202 (https://getpocket.atlassian.net/browse/OSL-202) needs to get done in order
    // to stop masking Apollo Errors.
    // formatError: errorHandler,
  });
}

/**
 * Create and start the apollo server. Required to await server.start()
 * before applying middleware.
 */
export async function startAdminServer(
  httpServer: Server,
): Promise<ApolloServer<IAdminContext>> {
  const server = getAdminServer(httpServer);
  await server.start();
  return server;
}
