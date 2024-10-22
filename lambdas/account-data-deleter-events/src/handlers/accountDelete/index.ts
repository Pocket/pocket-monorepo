import { AccountDeleteEvent } from '../../schemas/accountDeleteEvent';
import {
  callQueueDeleteEndpoint,
  callStripeDeleteEndpoint,
} from './postRequest';
import { SQSRecord } from 'aws-lambda';
import { AggregateError } from '../../errors/AggregateError';

type AccountDeleteBody = {
  userId: string;
  email?: string;
  isPremium: boolean;
  traceId?: string;
};

/**
 * Validates the account delete event payload and generate the POST body
 * @param message account delete event forwarded from event bridge
 * @returns validated body
 * @throws Error if message does not conform to schema
 */
export function validatePostBody(
  message: AccountDeleteEvent,
): AccountDeleteBody {
  AccountDeleteEvent.getAttributeTypeMap().forEach((type) => {
    if (message[type.name] == null && type.optional === false) {
      throw new Error(`${type.name} does not exist in message`);
    }
  });

  const postBody = {
    userId: message['userId'],
    email: message['email'] ?? undefined,
    isPremium: message['isPremium'] ?? false, // we don't have a user so we default to false
  };
  if (message['traceId']) {
    postBody['traceId'] = message['traceId'];
  }

  return postBody;
}

/**
 * Makes calls for deleting data associated with a Pocket
 * account. Includes calls to:
 *   * /queueDelete endpoint - queues up calls to delete
 *       rows from Pocket's internal database
 *   * stripe API - deletes stripe customer data (and internal
 *       stripe-related data in database)
 * @param record the event forwarded from event bridge via SQS
 * @throws Error if the record body does not conform to expected schema
 * @throws AggregateError if any errors encountered making
 * calls to endpoints or connecting to the database. Note that
 * Stripe API errors are handled separately and logged to Sentry
 * and Cloudwatch.
 */
export async function accountDeleteHandler(record: SQSRecord): Promise<void> {
  const message = JSON.parse(JSON.parse(record.body).Message)['detail'];
  const postBody = validatePostBody(message);
  const queueRes = await callQueueDeleteEndpoint(postBody);
  const stripeRes = await callStripeDeleteEndpoint(postBody);
  const errors: Error[] = [];
  for await (const { endpoint, res } of [
    { endpoint: 'queueDelete', res: queueRes },
    { endpoint: 'stripeDelete', res: stripeRes },
  ]) {
    if (!res.ok) {
      const data = await res.json();
      errors.push(
        new Error(
          `${endpoint} - ${res.status}\n${JSON.stringify(data.errors)}`,
        ),
      );
    }
  }
  if (errors.length) {
    throw new AggregateError(errors);
  }
}
