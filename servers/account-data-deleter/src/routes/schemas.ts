import { Schema } from 'express-validator';

export const accountDeleteSchema: Schema = {
  traceId: {
    in: ['body'],
    optional: true,
    isString: true,
    notEmpty: true,
  },
  userId: {
    in: ['body'],
    errorMessage: 'Must provide valid userId',
    isInt: true,
    toInt: true,
  },
  email: {
    in: ['body'],
    errorMessage: 'Must provide valid email',
  },
  isPremium: {
    in: ['body'],
    errorMessage: 'Must provide valid boolean (true or false)',
    isBoolean: true,
  },
};
