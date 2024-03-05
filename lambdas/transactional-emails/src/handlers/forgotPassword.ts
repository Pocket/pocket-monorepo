import { SQSRecord } from 'aws-lambda';
import { AccountDeleteEvent } from '../schemas/accountDeleteEvent';
import { sendAccountDeletionEmail } from '../braze';

/**
 * Validates that email is not null in the account delete event payload and
 * returns the email
 * @param message account delete event forwarded from event bridge
 * @returns email
 * @throws Error if email is missing in the event payload
 */
export function validateEventPayload(message: AccountDeleteEvent): string {
  if (message['email'] == null) {
    throw new Error('email is required in event payload');
  }

  if (message['resetPasswordToken'] == null) {
    throw new Error('resetPasswordToken is required in event payload');
  }

  if (message['resetPasswordUsername'] == null) {
    throw new Error('resetPasswordUsername is required in event payload');
  }

  if (message['timestamp'] == null) {
    throw new Error('timestamp is required in event payload');
  }
  return message['email'];
}

/**
 * Given an account delete event, make a request to send the account deletion
 * email.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function forgotPasswordHandler(record: SQSRecord) {
  const message = JSON.parse(JSON.parse(record.body).Message)['detail'];

  const email = validateEventPayload(message);

  await sendAccountDeletionEmail(email);
}
