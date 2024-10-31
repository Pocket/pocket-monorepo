/**
 * A base event that all events should extend from when they are Received only, not sent.
 */
export interface IncomingBaseEvent extends BaseEvent {
  account: string;
  id: string;
  region: string;
  time: Date;
  version: string;
}

export interface BaseEvent {
  // These get overriden by the extending event
  'detail-type': string;
  source: string;
  detail: any;
}
