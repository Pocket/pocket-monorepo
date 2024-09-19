import * as Sentry from '@sentry/node';
import {
  ApolloServerPlugin,
  BaseContext,
  GraphQLRequestListener,
} from '@apollo/server';
import { ApolloServerErrorCode } from '@apollo/server/errors';
import { InternalErrorCode } from '../errorHandler/errorHandler';
import { setLogger, Logger } from '@pocket-tools/ts-logger';

export const defaultLogger: Logger = setLogger();

/**
 * This is a list of error codes to not report in the sentry
 * plugin.
 */
const NO_REPORT_ERRORS = new Set<string>([
  // `InternalErrorCode`s to not report
  InternalErrorCode.BAD_USER_INPUT,
  InternalErrorCode.FORBIDDEN,
  InternalErrorCode.NOT_FOUND,
  InternalErrorCode.UNAUTHENTICATED,
  // `ApolloServerErrorCode`s to not report
  // some of these are duplicates, set will resolve and ensure these
  // are still ignored if they accidentally change upstream.
  ApolloServerErrorCode.BAD_REQUEST,
  ApolloServerErrorCode.BAD_USER_INPUT,
  ApolloServerErrorCode.GRAPHQL_PARSE_FAILED,
  ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED,
  ApolloServerErrorCode.OPERATION_RESOLUTION_FAILURE,
  ApolloServerErrorCode.PERSISTED_QUERY_NOT_FOUND,
  ApolloServerErrorCode.PERSISTED_QUERY_NOT_SUPPORTED,
]);

/**
 * Plugin for handling errors.
 * Logs the original error to console (for cloudwatch)
 * and Sentry.
 * This is only invoked if the graphql execution actually
 * started, so it will not send errors that occurred while
 * before the query could start (e.g. syntax error in graphql
 * query sent by client)
 */
// See https://blog.sentry.io/2020/07/22/handling-graphql-errors-using-sentry
export const sentryPlugin: ApolloServerPlugin<BaseContext> = {
  async requestDidStart(): Promise<GraphQLRequestListener<BaseContext>> {
    return {
      async didEncounterErrors(ctx) {
        if (!ctx.operation) {
          return;
        }
        for (const err of ctx.errors) {
          // Only report internal server errors,
          // errors extending ApolloError should be user-facing
          if (NO_REPORT_ERRORS.has(err.extensions?.code?.toString() ?? '')) {
            continue;
          }

          const operationKind = ctx.operation.operation;
          const operationQuery = ctx.request.query;
          const operationVariablesJson = JSON.stringify(ctx.request.variables);
          const requestId = ctx.request.http?.headers.get('x-graph-request-id');
          const requestTraceId = ctx.request.http?.headers.get('x-amzn-trace');
          const requestEncodedId = ctx.request.http?.headers.get('encodedId');
          const gatewayIpAddress =
            ctx.request.http?.headers.get('gatewayIpAddress');
          const originClientIp =
            ctx.request.http?.headers.get('origin-client-ip');
          const apiId = ctx.request.http?.headers.get('apiid');

          const errorData = {
            context: ctx, // contains most of the following, but move some fields up for easier filtering
            operationKind,
            operationQuery,
            operationVariables: operationVariablesJson,
            requestId,
            traceId: requestTraceId,
          };

          // log error
          defaultLogger.error({
            data: errorData,
            error: err,
            message: err.message,
          });

          const scope = Sentry.getCurrentScope();
          // kind of operation == query/mutation/subscription
          scope.setTag('kind', operationKind);
          scope.setExtra('query', operationQuery);
          scope.setExtra('variables', operationVariablesJson);

          if (requestId !== undefined) {
            scope.setTag('graphRequestId', requestId);
          }
          if (requestTraceId !== undefined) {
            scope.setTag('traceId', requestTraceId);
          }

          if (err.path) {
            scope.addBreadcrumb({
              category: 'query-path',
              message: err.path.join(' > '),
              level: 'debug',
            });
          }

          if (apiId !== undefined) {
            scope.setTag('pocket-api-id', apiId);
          }

          scope.setUser({
            id: (requestEncodedId as string) || undefined,
            ip_address:
              (gatewayIpAddress as string) ||
              (originClientIp as string) ||
              undefined,
          });

          // report error
          Sentry.captureException(err);
        }
      },
    };
  },
};
