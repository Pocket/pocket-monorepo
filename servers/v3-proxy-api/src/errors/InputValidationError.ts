import { ValidationError } from 'express-validator';

/**
 * Class for handling rejected queries due to failed validation.
 */
export class InputValidationError extends Error {
  status: 400;
  constructor(error: ValidationError) {
    let message;
    switch (error.type) {
      case 'field':
        // FieldValidationError
        message = `${error.msg}: ${JSON.stringify({
          location: error.location,
          path: error.path,
          type: error.type,
          value: error.value,
        })}`;
        break;
      case 'unknown_fields':
        // UnknownFieldValidationError
        message = `${error.msg}: ${JSON.stringify({ fields: error.fields })}`;
        break;
      case 'alternative':
        // AlternativeValidationError
        message = `${error.msg}: ${JSON.stringify(error.nestedErrors)}`;
        break;
      case 'alternative_grouped':
        // GroupedAlternativeValidationError
        message = `${error.msg}: ${JSON.stringify(error.nestedErrors)}`;
        break;
    }
    super(message);
    this.status = 400;
    // Set prototype chain for instance checks
    Object.setPrototypeOf(this, InputValidationError.prototype);
  }
}
