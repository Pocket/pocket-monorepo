import { buildSubgraphSchema } from '@apollo/subgraph';
import { ExpressContextFunctionArgument } from '@apollo/server/express4';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginInlineTraceDisabled,
  ApolloServerPluginUsageReportingDisabled,
} from '@apollo/server/plugin/disabled';
import { errorHandler, sentryPlugin } from '@pocket-tools/apollo-utils';
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';
import { typeDefs } from './typeDefs';
import { resolvers } from './resolvers';
import http from 'http';
import config from '../config';

/**
 * Represents the built up context that we take from the standard request headers
 * and pass it through as structured data to our Apollo Resolvers
 */
export interface RequestHandlerContext {
  headers: { [key: string]: any };
  ip?: string;
  forwardedIp?: string;
  locale?: string;
}

/**
 * Using our express context, lets build some structured data we want to pass to all our resolvers.
 * @param params
 */
export async function buildContext(
  params: ExpressContextFunctionArgument,
): Promise<RequestHandlerContext> {
  const { req } = params;
  // Prefer the x-forwarded-for value from gateway ('origin-client-ip'),
  // but default to x-forwarded-for on request header (useful e.g. for testing/local dev)
  const gatewayForwarded = req.headers['origin-client-ip'] as string;
  const xForwarded: string[] | string | undefined =
    req.headers['x-forwarded-for'];
  const forwardedIp = xForwarded instanceof Array ? xForwarded[0] : xForwarded;

  return {
    headers: req.headers,
    ip: req.ip,
    forwardedIp: gatewayForwarded ?? forwardedIp,
    locale: req.headers['accept-language'],
  };
}

/**
 * Build our apollo server
 * This is where we can do any apollo server configuration
 */
export const getApolloServer = async (
  httpServer: http.Server,
): Promise<ApolloServer<RequestHandlerContext>> => {
  const basePlugins = [
    sentryPlugin,
    ApolloServerPluginDrainHttpServer({ httpServer }),
  ];
  const prodPlugins = [
    ApolloServerPluginLandingPageDisabled(),
    ApolloServerPluginInlineTrace(),
  ];
  const nonProdPlugins = [
    ApolloServerPluginLandingPageLocalDefault(),
    ApolloServerPluginInlineTraceDisabled(),
    ApolloServerPluginUsageReportingDisabled(),
  ];
  const plugins =
    config.app.environment === 'production'
      ? basePlugins.concat(prodPlugins)
      : basePlugins.concat(nonProdPlugins);

  // Provide resolver functions for your schema fields
  const server = new ApolloServer<RequestHandlerContext>({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    plugins,
    formatError: config.app.environment !== 'test' ? errorHandler : undefined,
    introspection: true,
  });
  await server.start();
  return server;
};
