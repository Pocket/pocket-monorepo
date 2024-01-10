import { deliverEvents, logEventsError, logEventsReceived } from './sendgrid';
import { captureException, initSentry } from './sentry';

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
export const handler = async (event: any, context: any): Promise<boolean> => {
  // Note: since lamba actually has its own error handling wrapped around invocations, we need to try/catch and manually send to sentry
  // see https://gist.github.com/SarasArya/8626a311186a39572421b3eb6a9434ba
  initSentry();

  try {
    logEventsReceived(event.events);
    return await deliverEvents(event.events, event.queryParams);
  } catch (err) {
    // unless we have a requirement to return a specific error response, just throw the exception after sentry is handled
    logEventsError(event.events);
    await captureException(err, {
      type: 'sendgridDataRequest',
      data: JSON.stringify({
        err,
        context,
      }),
    });
    throw err;
  }
};
