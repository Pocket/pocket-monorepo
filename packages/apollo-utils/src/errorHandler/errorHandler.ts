import {
  GraphQLError,
  GraphQLFormattedError,
  GraphQLErrorOptions,
} from 'graphql';

/**
 * Internally managed error codes.  If a new error is added here,
 * it should be added to `NO_REPORT_ERRORS` in `sentryPlugin` if
 * we do not want to report it to sentry.
 */
export enum InternalErrorCode {
  BAD_USER_INPUT = 'BAD_USER_INPUT',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
}

/**
 * Used for formatting errors returned to the client. Hide any
 * errors that might reveal server details. Handle special cases
 * that we want to use to provide more information to the client
 * (e.g. NotFoundError).
 */
export function errorHandler(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  // Return the original error if it's wrapped (e.g. by a resolver)
  // Not using the unwrapResolverError method provided by apollo because
  // it checks for truthiness on the `path` property, which is undefined
  // if the error is thrown during context creation.
  // This little snippet just removes the `path` property check.
  // Additionally, don't rely on JUST the prototype chain to check for if
  // an error is a "GraphQLError", as the chain is potentially broken
  // in the request lifecycle. Also check for the 'name' property of the
  // error constructor or error itself, if it's set to "GraphQLError".
  const isGraphQLError = (error: any) =>
    error.constructor?.name === 'GraphQLError' ||
    error.name === 'GraphQLError' ||
    error instanceof GraphQLError
      ? true
      : false;
  const unwrapError = (error: any) => {
    if (isGraphQLError(error) && error.originalError) {
      return error.originalError;
    }
    return error;
  };
  if (isGraphQLError(unwrapError(error))) {
    return formattedError;
  } else {
    // Mask other kinds of errors
    return new InternalServerError('Internal server error', {
      originalError: error as Error,
      // preserve path and locations
      path: (error as GraphQLError)?.path,
      // The locations parameter cannot be specified from locations
      // (type mismatch), but will be built from positions and source
      // if provided. This is being explicitly tested for breaks.
      positions: (error as GraphQLError)?.positions,
      source: (error as GraphQLError)?.source,
    }).toJSON();
  }
}

export class NotFoundError extends GraphQLError {
  static errorPrefix = `Error - Not Found`;
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(`${NotFoundError.errorPrefix}: ${message}`, {
      ...options,
      extensions: { ...options?.extensions, code: InternalErrorCode.NOT_FOUND },
    });
  }
}

export class InternalServerError extends GraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message ?? 'Internal server error', {
      ...options,
      extensions: {
        ...options?.extensions,
        code: InternalErrorCode.INTERNAL_SERVER_ERROR,
      },
    });
  }
}

/**
 * @deprecated - use NotFoundError from this same package
 */
export class GraphQLNotFoundError extends GraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: { ...options?.extensions, code: InternalErrorCode.NOT_FOUND },
    });
  }
}

export class UserInputError extends GraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: InternalErrorCode.BAD_USER_INPUT,
      },
    });
  }
}

export class AuthenticationError extends GraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: InternalErrorCode.UNAUTHENTICATED,
      },
    });
  }
}

export class ForbiddenError extends GraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: InternalErrorCode.FORBIDDEN,
      },
    });
  }
}
