import { config } from '../config';
import { UserItemsSqsMessage } from '../types';
import { nanoid } from 'nanoid';
import { SQSRecord } from 'aws-lambda';
import fetch from 'node-fetch';

/**
 *
 * @param body
 */
export const processBody = async (record: SQSRecord): Promise<boolean> => {
  const messageBody: UserItemsSqsMessage = JSON.parse(record.body);
  const traceId = nanoid();

  for (const user of messageBody.userItems) {
    const { userId, itemIds } = user;

    console.log(`Started processing sqs items`, {
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

    const res = await fetch(config.search.endpoint + config.search.itemDelete, {
      method: 'post', // delete methods can not have a body
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postBody),
    });
    if (!res.ok) {
      const data = (await res.json()) as any;
      throw new Error(
        `userItemDelete - ${res.status}\n${JSON.stringify(data.errors)}`,
      );
    }

    console.log(`Completed processing items`, {
      userId,
      traceId,
    });
  }

  return true;
};
