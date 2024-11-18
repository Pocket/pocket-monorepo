import { config } from './config';
import { AccountDelete, IncomingBaseEvent } from '@pocket-tools/event-bridge';
import { PocketEventRecord } from './handlerMap';
import * as Sentry from '@sentry/aws-serverless';
import { serverLogger } from '@pocket-tools/ts-logger';

type AccountDeleteEvent = Exclude<PocketEventRecord, 'pocketEvent'> & {
  pocketEvent: AccountDelete & IncomingBaseEvent;
};

/**
 * Given an account delete event, call the batchDelete endpoint on the
 * user-list-search to delete all indexes associated with the user.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function accountDeleteHandler(
  event: AccountDeleteEvent[],
): Promise<string[]> {
  const promises = event.map((e) => {
    return proccessAccountDeleteEvent(e);
  });

  const failedEventIds = await Promise.all(promises);
  return failedEventIds.filter((id) => id !== null) as string[];
}

async function proccessAccountDeleteEvent(
  event: AccountDeleteEvent,
): Promise<string | null> {
  const postBody = {
    userId: event.pocketEvent.detail.userId,
  };
  if (event.pocketEvent.detail.traceId !== null) {
    postBody['traceId'] = event.pocketEvent.detail.traceId;
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
    const error = new Error(
      `batchDelete - ${res.status}\n${JSON.stringify(data.errors)}`,
    );
    Sentry.captureException(error);
    serverLogger.error(error);
    return event.messageId;
  }
  return null;
}
