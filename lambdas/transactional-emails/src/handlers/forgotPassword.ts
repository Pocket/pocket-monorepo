import { SQSRecord } from 'aws-lambda';
import { sendForgotPasswordEmail } from '../braze.js';
import { FogotPasswordResetEvent } from '../schemas/forgotPasswordResetEvent.js';

/**
 * Validates that email is not null in the forgot password event payload and
 * that we have valid reset information
 * @param message forgot password reset event forwarded from event bridge
 * @returns FogotPasswordResetEvent
 * @throws Error if email is missing in the event payload
 */
export function validateEventPayload(
  event: FogotPasswordResetEvent,
): FogotPasswordResetEvent {
  if (event.passwordResetInfo == null) {
    throw new Error('passwordResetInfo is required in event payload');
  }

  if (event.passwordResetInfo.resetPasswordToken == null) {
    throw new Error('resetPasswordToken is required in event payload');
  }

  if (event.passwordResetInfo.resetPasswordUsername == null) {
    throw new Error('resetPasswordUsername is required in event payload');
  }

  if (event.passwordResetInfo.timestamp == null) {
    throw new Error('reset timestamp is required in event payload');
  }

  if (event.user == null) {
    throw new Error('user is required in event payload');
  }

  if (event.user.email == null) {
    throw new Error('email is required in event payload');
  }

  if (event.user.encodedId == null) {
    throw new Error('encodedId is required in event payload');
  }

  return event;
}

/**
 * Given an account delete event, make a request to send the account deletion
 * email.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function forgotPasswordHandler(record: SQSRecord) {
  const message = JSON.parse(JSON.parse(record.body).Message)['detail'];

  const event = validateEventPayload(message);

  await sendForgotPasswordEmail({
    resetPasswordToken: event.passwordResetInfo.resetPasswordToken,
    resetTimeStamp: event.passwordResetInfo.timestamp,
    encodedId: event.user.encodedId,
    resetPasswordUsername: event.passwordResetInfo.resetPasswordUsername,
  });
}
