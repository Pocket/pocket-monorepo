import { ApolloServer } from 'apollo-server-express';
import { buildSubgraphSchema } from '@apollo/subgraph';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginInlineTraceDisabled,
  ApolloServerPluginUsageReportingDisabled,
} from 'apollo-server-core';
import { typeDefs } from '../server/typeDefs';
import { resolvers } from '../resolvers';
import { ContextManager } from '../server/context';

export const getTestServer = () => {
  return new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs: typeDefs, resolvers }),
    context: () => {
      return new ContextManager({
        request: {
          headers: {},
        },
      });
    },
    // Note the absence of the Sentry plugin - it emits
    // "Cannot read property 'headers' of undefined" errors in tests.
    // We get console.log statements that resolvers emit instead
    // but the tests pass.
    plugins: [
      ApolloServerPluginLandingPageDisabled(),
      ApolloServerPluginInlineTraceDisabled(),
      ApolloServerPluginUsageReportingDisabled(),
    ],
  });
};
