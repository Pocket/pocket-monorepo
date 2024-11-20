import { PutEventsRequestEntry } from '@aws-sdk/client-eventbridge';

/**
 * Error thrown when required fields are missing from an event.
 */
export class MissingFieldsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingFieldsError';
  }
}

export class OversizedEventError extends Error {
  constructor(private event: PutEventsRequestEntry) {
    super('Event is too large to send to EventBridge');
    this.name = 'EventTooLargeError';
  }
}
