import { SQSRecord } from 'aws-lambda';
import { PremiumPurchaseEvent } from '../schemas/premiumPurchaseSchema/premiumPurchaseEvent.js';
import { sendUserTrack } from '../braze.js';
import { User } from '../schemas/premiumPurchaseSchema/user.js';
import { Purchase } from '../schemas/premiumPurchaseSchema/purchase.js';

/**
 * validate the event payload with User and Purchase object of
 * premium purchase event
 * @param payload event payload from event-bridge
 */
export function validateEventPayload(payload: PremiumPurchaseEvent) {
  PremiumPurchaseEvent.getAttributeTypeMap().forEach((type) => {
    if (payload[type.name] == null) {
      throw new Error(`${type.name} does not exist in message`);
    }
  });

  const user = payload['user'];
  User.getAttributeTypeMap().forEach((type) => {
    if (user[type.name] == null) {
      throw new Error(
        `${type.name} does not exist under 'user' object in the message`,
      );
    }
  });

  const purchase = payload['purchase'];
  Purchase.getAttributeTypeMap().forEach((type) => {
    if (purchase[type.name] == null) {
      throw new Error(
        `${type.name} does not exist under 'purchase' object in the message`,
      );
    }
  });
}

/**
 * function to validate payload and send the event to braze
 * @param record contains premium purchase event from event-bridge
 */
export async function premiumPurchaseHandler(record: SQSRecord) {
  const payload: PremiumPurchaseEvent = JSON.parse(
    JSON.parse(record.body).Message,
  )['detail'];
  validateEventPayload(payload);
  const eventTime = new Date(
    JSON.parse(JSON.parse(record.body).Message)['time'],
  ).toISOString();

  const requestBody = generateUserTrackRequestBody(payload, eventTime);
  const res = await sendUserTrack(requestBody);
  if (!res.ok) {
    throw new Error(
      `Error ${res.status}: Failed to send premium purchase event`,
    );
  }
  return res;
}

function generateUserTrackRequestBody(
  payload: PremiumPurchaseEvent,
  eventTime: string,
): any {
  //todo: validate if request body contains relevant fields
  // when this event is consumed at braze
  return {
    events: [
      {
        external_id: payload.user.encodedId,
        name: 'premium_purchase',
        time: new Date(eventTime),
        properties: {
          amount: payload.purchase.amount,
          plan_type: payload.purchase.planType,
          renew_date: payload.purchase.renewDate,
          receipt_id: payload.purchase.receiptId,
          is_free: payload.purchase.isFree,
          is_trial: payload.purchase.isTrial,
          cancel_at_period_end: payload.purchase.cancelAtPeriodEnd,
          plan_interval: payload.purchase.planInterval,
        },
      },
    ],
  };
}
