import { ApolloServerPluginUsageReportingDisabled } from '@apollo/server/plugin/disabled';
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { sentryPlugin } from '../sentry/apolloSentryPlugin.ts';
import { Server } from 'http';
import { ApolloServerPlugin, BaseContext } from '@apollo/server';

/**
 * Standard set of plugins for Pocket systems
 * @param httpServer Server to pass through the drain plugin
 * @returns
 */
export const defaultPlugins = (
  httpServer: Server,
): ApolloServerPlugin<BaseContext>[] => {
  return [
    // Capture all errors into Sentry
    sentryPlugin,
    // Ensure that requests drain before we shut down the server
    ApolloServerPluginDrainHttpServer({ httpServer }),
    // All our subgraphs are behind a VPC and a VPN so its safe to enable the Landing Page
    ApolloServerPluginLandingPageLocalDefault({ footer: false }),
    // Enable the ftv trace in our response which will be used by the gateway, and ensure we include errors so we can see them in apollo studio.
    ApolloServerPluginInlineTrace({ includeErrors: { unmodified: true } }),
    // Disable Usage reporting on all subgraphs in all environments because our gateway/router will be the one reporting that.
    ApolloServerPluginUsageReportingDisabled(),
  ];
};
