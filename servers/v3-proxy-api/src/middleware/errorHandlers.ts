import { serverLogger } from '@pocket-tools/ts-logger';
import { NextFunction, Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { ClientError } from 'graphql-request';
import { InputValidationError } from '../errors/InputValidationError';

const errorHeaders = {
  INTERNAL_SERVER_ERROR: {
    'X-Error-Code': 198,
    en: 'Internal Server Error',
  },
  FORBIDDEN: {
    'X-Error-Code': 5200,
    en: 'Forbidden',
  },
  BAD_USER_INPUT: {
    'X-Error-Code': 130,
    en: 'Bad request',
  },
  GRAPHQL_VALIDATION_FAILED: {
    'X-Error-Code': 130,
    en: 'Bad request',
  },
};

/**
 * (Partial) implementation of v3 API's custom error headers.
 * See public_html/localization/dict-errors-*.json in Web repo.
 */
export function customErrorHeaders(errorCode: unknown, language = 'en') {
  if (
    typeof errorCode !== 'string' ||
    errorCode == null ||
    errorHeaders[errorCode] == null
  ) {
    return undefined;
  }
  //todo: proxy should handle localization based on web repo request.
  return {
    'X-Error-Code': errorHeaders[errorCode]['X-Error-Code'],
    'X-Error': errorHeaders[errorCode][language],
  };
}
/**
 * Handle errors thrown by GraphQL Client (returned by pocket-graph)
 * and validation errors (bad user input).
 * All other errors are returned as 500 errors.
 */
export function clientErrorHandler(
  err: Error | ClientError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const defaultMessage = 'Something Went Wrong';
  if (err instanceof ClientError) {
    res.status(err.response.status);
    // There might be more than 1 error, but we will just return the first
    const primaryError = err.response.errors?.[0];
    const headers = customErrorHeaders(primaryError.extensions.code);
    // Set headers if they're not undefined
    headers && res.set(headers);
    // Set error data
    const message = primaryError.message ?? defaultMessage;
    res.send({ error: message });
  } else if (err instanceof InputValidationError) {
    res
      .status(err.status)
      .set(customErrorHeaders('BAD_USER_INPUT'))
      .send({ error: err.message });
  } else {
    // Catchall
    res
      .status(500)
      .set(customErrorHeaders('INTERNAL_SERVER_ERROR'))
      .send({ error: err.message });
  }
}

/**
 * Log errors to Cloudwatch and capture in Sentry,
 * then pass to the next error handling middleware.
 */
export function logAndCaptureErrors(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Skip logging rejected queries from clients due to bad input
  if (err instanceof InputValidationError) {
    return next(err);
  } else if (err instanceof ClientError) {
    // Just log bad inputs, because that indicates a bug in the proxy code
    // Anything else should already be captured by the router/subgraphs
    if (err.response.status !== 400) {
      return next(err);
    }
  }
  // Okay, now we actually log things
  serverLogger.error(`${req.method}: ${req.baseUrl + req.path}: ${err}`);
  Sentry.captureException(err);
  next(err);
}
