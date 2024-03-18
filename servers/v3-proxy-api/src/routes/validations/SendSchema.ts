const BasicActionSchema: Schema[string] = {};

import { Schema } from 'express-validator';

/**
 * Schema for valid V3 GET/POST requests.
 * Depending on the method, checkSchema looks
 * for the data in the query or the body.
 *
 * This gives us some safety from bad user input values
 * and limits the cases we have to handle downstream.
 */
export const V3SendSchema: Schema = {
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
  'actions[*].action': {
    isIn: {
      options: [
        [
          'add',
          'readd',
          // 'archive',
          // 'favorite',
          // 'unfavorite',
          // 'delete',
          // 'tags_add',
          // 'tags_remove',
          // 'tags_replace',
          // 'tags_clear',
          // 'tags_rename',
          // 'tags_delete',
        ],
      ],
      bail: true,
      errorMessage: `invalid action`,
    },
  },
};
