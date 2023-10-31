import { ApolloServerErrorCode } from '@apollo/server/errors';
import { InternalErrorCode, errorHandler } from '@pocket-tools/apollo-utils';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

export const isGatewayError = (value: unknown): value is GraphQLError =>
  !!value &&
  typeof value == 'object' &&
  'extensions' in value &&
  typeof (value as GraphQLError).extensions === 'object' &&
  'code' in (value as GraphQLError).extensions &&
  typeof (value as GraphQLError).extensions.code === 'string';

const pocketErrorCodes = Object.values(InternalErrorCode);
const apolloErrorCodes = Object.values(ApolloServerErrorCode);
export const gatewayUnmaskedErrors = new Set<string>([
  ...pocketErrorCodes,
  ...apolloErrorCodes,
]);

export function gatewayErrorHandler(
  formattedError: GraphQLFormattedError,
  error: GraphQLError
): GraphQLFormattedError {
  if (
    isGatewayError(error) &&
    gatewayUnmaskedErrors.has(error.extensions.code as string)
  ) {
    // This isn't ideal, since in the subgraphs these error classes would be
    // more specific - e.g. NotFoundError, CustomGraphQLError, etc.
    // but for the sake of not altering the apollo-utils errorHandler doing checks via class type &&
    // having our subgraph error blobs be processed correctly by that apollo-utils errorHandler,
    // this just recreates the errors as a generic GraphQL Error w/all the original details
    // passed through. It is infinitely more complicated to map Error Codes to specific classes here.
    const reworkedError = new GraphQLError(error.message, {
      ...error,
    });
    return errorHandler(formattedError, reworkedError);
  }
  return errorHandler(formattedError, error);
}
