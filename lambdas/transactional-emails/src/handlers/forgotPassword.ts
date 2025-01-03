import { sendForgotPasswordEmail } from '../braze.ts';
import { PocketEventType, PocketEvent } from '@pocket-tools/event-bridge';

/**
 * Given an account delete event, make a request to send the account deletion
 * email.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @throws Error if response is not ok
 */
export async function forgotPasswordHandler(event: PocketEvent) {
  if (event?.['detail-type'] === PocketEventType.FORGOT_PASSWORD) {
    return await sendForgotPasswordEmail({
      resetPasswordToken: event.detail.passwordResetInfo.resetPasswordToken,
      resetTimeStamp: event.detail.passwordResetInfo.timestamp,
      encodedId: event.detail.user.encodedId,
      resetPasswordUsername:
        event.detail.passwordResetInfo.resetPasswordUsername,
    });
  }
  return;
}
