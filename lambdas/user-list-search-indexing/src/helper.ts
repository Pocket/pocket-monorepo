import {
  UserItemsSqsMessage,
  UserListImportSqsMessage,
} from '@pocket-tools/types';
import { nanoid } from 'nanoid';
import { config } from './config';

/**
 * Processes messages from the itemDelete queue or the itemUpdate queues.
 * This will call the user search api with a set of userId : itemIds to be indexed/or deleted depending on the endpoint called
 * @param body
 * @param endpoint
 * @returns
 */
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

/**
 * Processes messages from the list import queues. This queue contains messages of userIds to go through a full search indexing.
 * This will call the user search api with a user id to begin indexing. user search will then queue up all the items for the user into the itemUpdate queue (above).
 * Depending on if this method was called from a backfill lambda (ie if we ever need to reprocess all users) it will also tell the api that which will send the itemIds into a lower or higher priority queue respectively.
 * @param body
 * @param endpoint
 * @returns
 */
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
    const data = await res.text();
    throw new Error(`${res.status}\n${data}`);
  }
};
