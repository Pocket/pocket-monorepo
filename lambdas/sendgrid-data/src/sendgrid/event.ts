/**
 * Note: `blocked` is derived from `bounce` (which has an attribute `type = blocked`)
 *
 * @see https://keen.io/docs/integrations/sendgrid/
 * @see https://sendgrid.com/docs/for-developers/tracking-events/event/
 */
export type EventType =
  | 'bounce'
  | 'blocked'
  | 'click'
  | 'deferred'
  | 'delivered'
  | 'dropped'
  | 'open'
  | 'processed'
  | 'spamreport'
  | 'unsubscribe'
  | 'group_subscribe'
  | 'group_unsubscribe';

export type Event = {
  event: EventType;
  email: string;
  timestamp: number;
  [key: string]: any;
};
