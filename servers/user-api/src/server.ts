import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefs } from './typeDefs';
import { resolvers } from './resolvers';
import { defaultPlugins, errorHandler } from '@pocket-tools/apollo-utils';
import { IContext } from './context';
import { Server } from 'http';

export function getServer(httpServer: Server) {
  return new ApolloServer<IContext>({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    plugins: defaultPlugins(httpServer),
    formatError: errorHandler,
    introspection: true,
  });
}
