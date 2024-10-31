/**
 * Error thrown when required fields are missing from an event.
 */
export class MissingFieldsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingFieldsError';
  }
}
