import { v4 as uuidv4 } from 'uuid';

export const generateId = uuidv4;

export class SQSBatchSendError extends Error {
  details = null;

  constructor(message, details) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
