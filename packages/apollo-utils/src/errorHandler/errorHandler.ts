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
  const unwrapError = (error: unknown) => {
    if (error instanceof GraphQLError && error.originalError) {
      return error.originalError;
    }
    return error;
  };
  if (unwrapError(error) instanceof GraphQLError) {
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

/**
 * CustomGraphQLError exists for providing common extensions for all
 * custom internal errors. Otherwise, all implementation is just relying
 * on GraphQLError
 *
 * This really shouldn't be used directly, but is exported so that other
 * packages or consumers can extend this same interface (though they really
 * should implement here to prevent duplicate implementations!). Still, exported
 * because there could be a subgraph that we never intend to federate or
 * similar use cases in the future.
 *
 * To extend this, create a unique error code for your new error, and add
 * it to the InternalErrorCode enum above, add the error code to NO_REPORT_ERRORS
 * in `sentryPlugin.ts`, and implement an error extension class below.
 */
export class CustomGraphQLError extends GraphQLError implements Error {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, options);

    // this should be overwritten by extension, setting just in case
    Object.defineProperty(this, 'name', { value: 'CustomGraphQLError' });
  }
}

export class NotFoundError extends CustomGraphQLError {
  static errorPrefix = `Error - Not Found`;
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(`${NotFoundError.errorPrefix}: ${message}`, {
      ...options,
      extensions: { ...options?.extensions, code: InternalErrorCode.NOT_FOUND },
    });

    Object.defineProperty(this, 'name', { value: 'NotFoundError' });
  }
}

export class InternalServerError extends CustomGraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message ?? 'Internal server error', {
      ...options,
      extensions: {
        ...options?.extensions,
        code: InternalErrorCode.INTERNAL_SERVER_ERROR,
      },
    });

    Object.defineProperty(this, 'name', { value: 'InternalServerError' });
  }
}

/**
 * @deprecated - use NotFoundError from this same package
 */
export class GraphQLNotFoundError extends CustomGraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: { ...options?.extensions, code: InternalErrorCode.NOT_FOUND },
    });

    Object.defineProperty(this, 'name', { value: 'NotFoundError' });
  }
}

export class UserInputError extends CustomGraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: InternalErrorCode.BAD_USER_INPUT,
      },
    });

    Object.defineProperty(this, 'name', { value: 'UserInputError' });
  }
}

export class AuthenticationError extends CustomGraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: InternalErrorCode.UNAUTHENTICATED,
      },
    });

    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
}

export class ForbiddenError extends CustomGraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        ...options?.extensions,
        code: InternalErrorCode.FORBIDDEN,
      },
    });

    Object.defineProperty(this, 'name', { value: 'ForbiddenError' });
  }
}
