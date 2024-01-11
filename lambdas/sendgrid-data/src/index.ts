import config from './config';
import { deliverEvents, logEventsError, logEventsReceived } from './sendgrid';
import * as Sentry from '@sentry/serverless';
import { captureException } from './sentry';
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';

Sentry.AWSLambda.init({
  dsn: config.sentry.dsn,
  release: config.sentry.release,
  environment: config.environment,
});

/**
 * Format the response data
 * Source: https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html#apigateway-types-transforms
 * @param statusCode
 * @param message
 * @param isError
 */
export function formatResponse(
  statusCode: number,
  message: string,
  isError?: boolean,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      statusCode,
      [isError ? 'error' : 'message']: message,
    }),
  };
}

/**
 * Note: if a handler method returns null, you need to assign a sentinel value otherwise TS doesn't like it.
 *
 * ```
 * // wrong
 * const value = methodCanReturnObjectOrNull();
 * if (value === null) { doErrorHandling }
 * return value;
 *
 * // right
 * const value = methodCanReturnObjectOrNull || ERR;
 * if (value === ERR) { doErrorHandling }
 * return value;
 * ```
 *
 * @param event
 * @param context
 */
const eventHandler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log(JSON.stringify(event));
    const events = JSON.parse(event.body);
    logEventsReceived(events);
    await deliverEvents(events, event.queryStringParameters);
    return formatResponse(200, 'success', false);
  } catch (err) {
    captureException(err);
    // unless we have a requirement to return a specific error response, just throw the exception after logging
    logEventsError(event);
    return formatResponse(500, err.message, true);
  }
};

export const handler = Sentry.AWSLambda.wrapHandler(eventHandler);
