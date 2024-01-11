export class StartDateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StartDateError';
  }
}

export class AccountAgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountAgeError';
  }
}

export class AccountCreatedAtError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountCreatedAtError';
  }
}

export class SessionIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionIdError';
  }
}
