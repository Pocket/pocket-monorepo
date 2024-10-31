import { SQSRecord } from 'aws-lambda';
import { sendForgotPasswordEmail } from '../braze';
import { sqsEventBridgeEvent, Event } from '@pocket-tools/event-bridge';

/**
 * Given an account delete event, make a request to send the account deletion
 * email.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function forgotPasswordHandler(record: SQSRecord) {
  const event = sqsEventBridgeEvent(record);
  if (event === null || !(event?.['detail-type'] !== Event.FORGOT_PASSWORD)) {
    return;
  }
  await sendForgotPasswordEmail({
    resetPasswordToken: event.detail.passwordResetInfo.resetPasswordToken,
    resetTimeStamp: event.detail.passwordResetInfo.timestamp.toFixed(0),
    encodedId: event.detail.user.encodedId,
    resetPasswordUsername: event.detail.passwordResetInfo.resetPasswordUsername,
  });
}
