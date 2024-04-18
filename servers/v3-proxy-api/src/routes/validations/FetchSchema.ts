import { Schema } from 'express-validator';

/**
 * Note: this type is manually documented, since the
 * Schema validator doesn't infer types.
 */
export type V3FetchParams = {
  access_token: string;
  consumer_key: string;
  annotations: boolean;
  chunk?: number;
  count: number;
  offset: number;
  shares?: boolean;
  updatedBefore?: number;
  taglist: boolean;
  forcetaglist: boolean;
  since?: number;
  hasAnnotations?: boolean;
};

/**
 * Schema for valid V3 GET/POST requests.
 * Depending on the method, checkSchema looks
 * for the data in the query or the body.
 *
 * This gives us some safety from bad user input values
 * and limits the cases we have to handle downstream.
 */
export const V3FetchSchema: Schema = {
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
  offset: {
    // offet of the items to return.
    default: {
      options: 0,
    },
    isInt: {
      options: {
        min: 0,
      },
      errorMessage: '`offset` cannot be negative',
    },
    customSanitizer: {
      options: (value) => (typeof value === 'string' ? parseInt(value) : value),
    },
  },
  count: {
    optional: true,
    isInt: {
      options: {
        min: 1,
        max: 5000,
      },
    },
    customSanitizer: {
      options: (value) => (typeof value === 'string' ? parseInt(value) : value),
    },
  },
  chunk: {
    default: {
      options: 0,
    },
    isInt: {
      options: {
        min: 0,
        max: 5000,
      },
    },
    customSanitizer: {
      options: (value) => (typeof value === 'string' ? parseInt(value) : value),
    },
  },
  updatedBefore: {
    optional: true,
    isInt: {
      options: {
        min: 0,
      },
    },
    customSanitizer: {
      options: (value) => (typeof value === 'string' ? parseInt(value) : value),
    },
  },
  shares: {
    default: {
      options: '0',
    },
    isIn: {
      options: [['0', '1']],
    },
    customSanitizer: {
      options: (value) => (value === '1' ? true : false),
    },
  },
  annotations: {
    default: {
      options: '1',
    },
    isIn: {
      options: [['0', '1']],
    },
    customSanitizer: {
      options: (value) => (value === '1' ? true : false),
    },
  },
  taglist: {
    default: {
      options: '0',
    },
    isIn: {
      options: [['0', '1']],
    },
    customSanitizer: {
      options: (value) => (value === '1' ? true : false),
    },
  },
  forcetaglist: {
    default: {
      options: '0',
    },
    isIn: {
      options: [['0', '1']],
    },
    customSanitizer: {
      options: (value) => (value === '1' ? true : false),
    },
  },
  since: {
    optional: true,
    isInt: {
      options: {
        min: 0,
      },
    },
    toInt: true,
  },
  hasAnnotations: {
    optional: true,
    isIn: {
      options: [['0', '1']],
    },
    customSanitizer: {
      options: (value) => (value === '1' ? true : false),
    },
  },
};
