export class AggregateError extends Error {
  private _errors: Error[];
  constructor(errors: Error[]) {
    const message = errors.reduce((stackString, error) => {
      stackString += error.message ? `\n${error.message}` : '';
      return error.stack ? stackString + `\n\n${error.stack}` : stackString;
    }, '');
    super(message);
    this.name = 'AggregateError';
    this._errors = errors;
  }
  get errors() {
    return this._errors.slice();
  }
}
