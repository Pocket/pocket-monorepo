import fetchRetry from 'fetch-retry';
import { config } from '../../config.ts';

const newFetch = fetchRetry(fetch);

/**
 * Generic post builder with retry logic
 * https://www.npmjs.com/package/fetch-retry
 * @param body post body
 * @param path the path to post to
 * @param endpoint the endpoint of the API
 * @returns the fetch response Promise
 */
async function postRequest(
  body: any,
  path: string,
  endpoint?: string,
): Promise<any> {
  const fetchPath = (endpoint ?? config.endpoint) + path;
  return newFetch(fetchPath, {
    retryOn: [500, 502, 503],
    retryDelay: (attempt, error, response) => {
      return Math.pow(2, attempt) * 500;
    },
    retries: 3,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/**
 * Call the queueDelete endpoint; kicks off queries for deleting records
 * in Pocket database associated with a Pocket User after they delete their
 * account.
 * @param body
 * @returns
 */
export async function callQueueDeleteEndpoint(body: any): Promise<any> {
  return postRequest(body, config.queueDeletePath, config.endpoint);
}
/**
 * Call the stripeDelete endpoint; kicks off queries for deleting data from
 * Stripe and Pocket's internal database associated with a Pocket User after
 * they delete their account.
 * @param body
 * @returns
 */
export async function callStripeDeleteEndpoint(body: any): Promise<any> {
  return postRequest(body, config.stripeDeletePath, config.endpoint);
}

/**
 * Revoke FxA Access Token when a user deletes their account
 * @param body
 * @returns
 */
export async function callFxARevokeEndpoint(body: any): Promise<any> {
  return postRequest(body, config.fxaRevokePath, config.endpoint);
}
