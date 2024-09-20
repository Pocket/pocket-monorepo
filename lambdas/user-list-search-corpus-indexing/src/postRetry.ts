import fetchRetry from 'fetch-retry';
const newFetch = fetchRetry(fetch);

/**
 * Generic post builder with retry logic
 * https://www.npmjs.com/package/fetch-retry
 * @param body post body
 * @param path the path to post to
 * @param endpoint the endpoint of the API
 * @returns the fetch response Promise
 */
export const postRetry = async (
  endpoint: string,
  body: BodyInit,
  headers?: HeadersInit,
) => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  const passedHeaders =
    headers != null ? { ...defaultHeaders, ...headers } : defaultHeaders;
  return await newFetch(endpoint, {
    retryOn: [500, 502, 503],
    retryDelay: (attempt) => {
      return Math.pow(2, attempt) * 500;
    },
    retries: 3,
    method: 'post',
    headers: passedHeaders,
    body,
  });
};
