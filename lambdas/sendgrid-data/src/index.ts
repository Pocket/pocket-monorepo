import config from './config';
import { deliverEvents, logEventsError, logEventsReceived } from './sendgrid';
import * as Sentry from '@sentry/serverless';
import { captureException } from './sentry';

Sentry.AWSLambda.init({
  dsn: config.sentry.dsn,
  release: config.sentry.release,
});

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
const eventHandler = async (event: any, context: any): Promise<boolean> => {
  try {
    logEventsReceived(event.events);
    return await deliverEvents(event.events, event.queryParams);
  } catch (err) {
    captureException(err);
    // unless we have a requirement to return a specific error response, just throw the exception after logging
    logEventsError(event);
    throw err;
  }
};

export const handler = Sentry.AWSLambda.wrapHandler(eventHandler);
