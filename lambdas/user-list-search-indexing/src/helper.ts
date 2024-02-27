import { UserItemsSqsMessage, UserListImportSqsMessage } from './types';
import { nanoid } from 'nanoid';
import fetch from 'node-fetch';
import { config } from './config';

export const processUserImport = async (
  body: UserListImportSqsMessage,
  endpoint: string,
): Promise<boolean> => {
  const traceId = nanoid();
  for (const user of body.users) {
    const { userId } = user;
    const backfill = config.backfill;

    console.info(`Started processing sqs items`, {
      userId,
      // When we move to using the events, we should pull the events trace id.
      traceId,
      backfill,
    });

    const postBody = {
      userId,
      traceId,
      // if its a backfill, tell the endpoint so it is loaded into the a lower prirority backfill queue by the server
      backfill,
    };

    await sendRequest(endpoint, postBody);

    console.info(`Completed processing items`, {
      userId,
      traceId,
      backfill,
    });
  }

  return true;
};

export const processUserItem = async (
  body: UserItemsSqsMessage,
  endpoint: string,
): Promise<boolean> => {
  const traceId = nanoid();

  for (const user of body.userItems) {
    const { userId, itemIds } = user;

    console.info(`Started processing sqs items`, {
      userId,
      itemIds,
      // When we move to using the events, we should pull the events trace id.
      traceId,
    });

    const postBody = {
      userId,
      itemIds,
      traceId,
    };

    await sendRequest(endpoint, postBody);

    console.info(`Completed processing items`, {
      userId,
      traceId,
    });
  }

  return true;
};

const sendRequest = async (endpoint: string, postBody: any) => {
  const res = await fetch(endpoint, {
    method: 'post', // delete methods can not have a body
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postBody),
  });
  if (!res.ok) {
    const data = (await res.json()) as any;
    throw new Error(`${res.status}\n${JSON.stringify(data.errors)}`);
  }
};
