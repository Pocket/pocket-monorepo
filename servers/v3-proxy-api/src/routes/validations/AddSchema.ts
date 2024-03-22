import { Schema } from 'express-validator';

/**
 * Note: this type is manually documented, since the
 * Schema validator doesn't infer types.
 */
export type V3AddParams = {
  access_token: string;
  consumer_key: string;
  url: string;
  tags?: string[];
  title?: string;
};

/**
 * Schema for valid /v3/add requests.
 * Depending on the method, checkSchema looks
 * for the data in the query or the body.
 *
 * This gives us some safety from bad user input values
 * and limits the cases we have to handle downstream.
 */
export const V3AddSchema: Schema = {
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
  url: {
    isURL: true,
  },
  title: {
    optional: true,
    isString: true,
    notEmpty: true,
  },
  tags: {
    optional: true,
    isString: true,
    customSanitizer: {
      options: (tags) => tags.split(','),
    },
    custom: {
      options: (tags) =>
        Array.isArray(tags) &&
        tags.length > 0 &&
        tags.filter((v) => v === '').length === 0,
    },
  },
};
