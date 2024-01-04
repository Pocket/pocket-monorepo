import { ApolloServer, ApolloServerPlugin } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefs } from './typeDefs';
import { resolvers } from './resolvers';
import { errorHandler, sentryPlugin } from '@pocket-tools/apollo-utils';
import {
  ApolloServerPluginInlineTraceDisabled,
  ApolloServerPluginUsageReportingDisabled,
} from '@apollo/server/plugin/disabled';
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { IContext } from './context';
import { Server } from 'http';

export function getServer(httpServer: Server) {
  const defaultPlugins = [
    // On initialization, this plugin automatically begins caching responses according to field settings
    // see shareableListPublic cache control settings
    sentryPlugin,
    ApolloServerPluginDrainHttpServer({ httpServer }),
    ApolloServerPluginUsageReportingDisabled(),
    ApolloServerPluginLandingPageLocalDefault({ footer: false }),
  ];

  // map of plugins for each node environment
  const environmentPlugins: Record<
    'test' | 'development' | 'production',
    ApolloServerPlugin[]
  > = {
    test: [ApolloServerPluginInlineTraceDisabled()],
    development: [
      ApolloServerPluginInlineTrace({
        includeErrors: { unmodified: true },
      }),
    ],
    production: [
      ApolloServerPluginInlineTrace({
        includeErrors: { unmodified: true },
      }),
    ],
  };

  // combine default plugins with environment specific plugins for this server
  // instance
  const plugins = defaultPlugins.concat(
    environmentPlugins[process.env.NODE_ENV] ?? [],
  );

  return new ApolloServer<IContext>({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    plugins,
    formatError: errorHandler,
    introspection: true,
  });
}
