import { SQSRecord } from 'aws-lambda';
import { config } from './config.js';
import fetch from 'node-fetch';

/**
 * Given an account delete event, call the batchDelete endpoint on the
 * user-list-search to delete all indexes associated with the user.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function accountDeleteHandler(record: SQSRecord): Promise<void> {
  const message = JSON.parse(JSON.parse(record.body).Message)['detail'];
  const postBody = {
    userId: message['userId'],
  };
  if (message['traceId']) {
    postBody['traceId'] = message['traceId'];
  }
  const res = await fetch(config.endpoint + config.accountDeletePath, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postBody),
  });
  if (!res.ok) {
    const data = (await res.json()) as any;
    throw new Error(
      `batchDelete - ${res.status}\n${JSON.stringify(data.errors)}`,
    );
  }
}
