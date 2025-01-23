import { sendUserTrack } from '../braze.ts';
import {
  PocketEvent,
  PocketEventType,
  PremiumPurchaseEvent,
  IncomingPocketEvent,
} from '@pocket-tools/event-bridge';

/**
 * function to validate payload and send the event to braze
 * @param event contains premium purchase event from event-bridge
 */
export async function premiumPurchaseHandler(
  event: PocketEvent & IncomingPocketEvent,
): Promise<Response | null> {
  if (event?.['detail-type'] === PocketEventType.PREMIUM_PURCHASE) {
    const requestBody = generateUserTrackRequestBody(event, event.time);
    return await sendUserTrack(requestBody);
  }
  return null;
}

function generateUserTrackRequestBody(
  payload: PremiumPurchaseEvent,
  eventTime: Date,
): any {
  //todo: validate if request body contains relevant fields
  // when this event is consumed at braze
  return {
    events: [
      {
        external_id: payload.detail.user?.encodedId,
        name: 'premium_purchase',
        time: eventTime,
        properties: {
          amount: payload.detail.purchase.amount,
          plan_type: payload.detail.purchase.planType,
          renew_date: payload.detail.purchase.renewDate,
          receipt_id: payload.detail.purchase.receiptId,
          is_free: payload.detail.purchase.isFree,
          is_trial: payload.detail.purchase.isTrial,
          cancel_at_period_end: payload.detail.purchase.cancelAtPeriodEnd,
          plan_interval: payload.detail.purchase.planInterval,
        },
      },
    ],
  };
}
