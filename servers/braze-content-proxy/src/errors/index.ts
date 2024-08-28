import config from '../config';

export class InvalidAPIKeyError extends Error {
  status: 403;
  constructor() {
    super(config.app.INVALID_API_KEY_ERROR_MESSAGE);
    this.status = 403;
    // Set prototype chain for instance checks
    Object.setPrototypeOf(this, InvalidAPIKeyError.prototype);
  }
}

export class InvalidDateError extends Error {
  status: 400;
  constructor() {
    super('Not a valid date. Please provide a date in YYYY-MM-DD format.');
    this.status = 400;
    // Set prototype chain for instance checks
    Object.setPrototypeOf(this, InvalidAPIKeyError.prototype);
  }
}

export class InvalidUserId extends Error {
  status: 400;
  constructor() {
    super('Not a valid user id');
    this.status = 400;
    // Set prototype chain for instance checks
    Object.setPrototypeOf(this, InvalidUserId.prototype);
  }
}
