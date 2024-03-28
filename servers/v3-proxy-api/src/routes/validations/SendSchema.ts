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
  actions: {
    isArray: true,
    notEmpty: true,
  },
  'actions[*].action': {
    isIn: {
      options: [
        [
          'add',
          'readd',
          'archive',
          'favorite',
          'unfavorite',
          'delete',
          'tags_add',
          'tags_remove',
          'tags_replace',
          'tags_clear',
          'tag_rename',
          'tag_delete',
        ],
      ],
      bail: true,
      errorMessage: `Invalid action`,
    },
  },
};
