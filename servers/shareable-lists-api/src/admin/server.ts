import { ApolloServer } from '@apollo/server';
import { Server } from 'http';
import { defaultPlugins } from '@pocket-tools/apollo-utils';
import { IAdminContext } from './context';
import { schema } from './schema';
import { createApollo4QueryValidationPlugin } from 'graphql-constraint-directive/apollo4';

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
      createApollo4QueryValidationPlugin({
        schema,
      }),
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
