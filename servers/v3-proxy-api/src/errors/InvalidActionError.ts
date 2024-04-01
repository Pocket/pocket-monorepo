/**
 * Class for handling rejected queries due to failed validation.
 */
export class InvalidActionError extends Error {
  status: 405;
  constructor(action: string) {
    super(`Invalid Action: '${action}'`);
    this.status = 405;
    // Set prototype chain for instance checks
    Object.setPrototypeOf(this, InvalidActionError.prototype);
  }
}
