import { config } from './config';
import { AccountDelete } from '@pocket-tools/event-bridge';

/**
 * Given an account delete event, call the batchDelete endpoint on the
 * user-list-search to delete all indexes associated with the user.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function accountDeleteHandler(
  event: AccountDelete,
): Promise<void> {
  const postBody = {
    userId: event.detail.userId,
  };
  if (event.detail.traceId !== null) {
    postBody['traceId'] = event.detail.traceId;
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
