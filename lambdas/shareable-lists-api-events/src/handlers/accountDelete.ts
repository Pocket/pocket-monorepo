import { SQSRecord } from 'aws-lambda';
import { config } from '../config';
import isomorphicFetch from 'isomorphic-fetch';
import fetchRetry from 'fetch-retry';

const fetch = fetchRetry(isomorphicFetch);
/**
 * Invoke the deleteUserData express endpoint in shareable-lists-api
 * to delete user data
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function accountDeleteHandler(record: SQSRecord) {
  const message = JSON.parse(JSON.parse(record.body).Message)['detail'];
  const postBody = {
    userId: message['userId'],
  };
  const res = await fetch(config.apiEndpoint + config.deleteUserDataPath, {
    retryOn: [500, 502, 503],
    retryDelay: (attempt, error, response) => {
      return Math.pow(2, attempt) * 500;
    },
    retries: 3,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postBody),
  });
  if (!res.ok) {
    const data = (await res.json()) as any;
    throw new Error(
      `accountDeleteHandler: ${res.status}\n${JSON.stringify(data.errors)}`
    );
  }
}
