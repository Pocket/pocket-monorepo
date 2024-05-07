import { Schema } from 'express-validator';
import { MaybeAction } from './SendActionValidators';

export type V3SendParams = {
  access_token: string;
  consumer_key: string;
  actions: MaybeAction[];
};

/**
 * Schema for valid V3 GET/POST requests.
 * Depending on the method, checkSchema looks
 * for the data in the query or the body.
 *
 * This gives us some safety from bad user input values
 * and limits the cases we have to handle downstream.
 */
export const V3SendSchemaPost: Schema = {
  access_token: {
    isString: true,
    notEmpty: {
      errorMessage: '`access_token` cannot be empty',
    },
  },
  consumer_key: {
    isString: true,
    notEmpty: {
      errorMessage: '`consumer_key` cannot be empty',
    },
  },
  actions: {
    notEmpty: true,
    customSanitizer: {
      // If we get a urlencoded string payload, decode it into JSON array
      options: (value) =>
        typeof value === 'string'
          ? JSON.parse(decodeURIComponent(value))
          : value,
    },
    custom: {
      options: (arr) =>
        arr.length > 0 &&
        arr.filter((action) => !(action.action && action.action !== ''))
          .length === 0
          ? true
          : false,
    },
  },
};

/**
 * Schema for valid V3 GET/POST requests.
 * Depending on the method, checkSchema looks
 * for the data in the query or the body.
 *
 * This gives us some safety from bad user input values
 * and limits the cases we have to handle downstream.
 */
export const V3SendSchemaGet: Schema = {
  access_token: {
    isString: true,
    notEmpty: {
      errorMessage: '`access_token` cannot be empty',
    },
  },
  consumer_key: {
    isString: true,
    notEmpty: {
      errorMessage: '`consumer_key` cannot be empty',
    },
  },
  actions: {
    isString: true,
    notEmpty: true,
    customSanitizer: {
      options: (value) => {
        // Is this already decoded JSON string?
        try {
          const actions = JSON.parse(value);
          return actions;
        } catch (err) {
          // If not, it's probably a url-encoded JSON string
          // which needs to be decoded first
          if (err instanceof SyntaxError) {
            return JSON.parse(decodeURIComponent(value));
          }
        }
      },
    },
    custom: {
      options: (arr) =>
        arr.length > 0 &&
        arr.filter((action) => !(action.action && action.action !== ''))
          .length === 0
          ? true
          : false,
    },
  },
};
