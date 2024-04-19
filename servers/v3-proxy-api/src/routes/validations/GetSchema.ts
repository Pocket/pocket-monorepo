import { Schema } from 'express-validator';

/**
 * Note: this type is manually documented, since the
 * Schema validator doesn't infer types.
 */
export type V3GetParams = {
  access_token?: string;
  consumer_key: string;
  contentType?: 'article' | 'image' | 'video';
  count: number;
  detailType: 'simple' | 'complete';
  favorite?: boolean;
  offset: number;
  since?: number;
  sort: 'newest' | 'oldest' | 'relevance';
  state?: 'unread' | 'read' | 'archive' | 'queue' | 'all';
  tag?: string;
  total: boolean;
  search?: string;
  annotations: boolean;
  taglist: boolean;
  forcetaglist: boolean;
  hasAnnotations?: boolean;
  account: boolean;
  forceaccount: boolean;
  updatedBefore?: number;
};

/**
 * Schema for valid V3 GET/POST requests.
 * Depending on the method, checkSchema looks
 * for the data in the query or the body.
 *
 * This gives us some safety from bad user input values
 * and limits the cases we have to handle downstream.
 */
export const V3GetSchema: Schema = {
  access_token: {
    optional: true,
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
  detailType: {
    toLowerCase: true,
    default: {
      options: 'simple',
    },
    isIn: {
      options: [['simple', 'complete']],
    },
  },
  state: {
    optional: true,
    toLowerCase: true,
    isIn: {
      // The following legacy filters for state are omitted
      // (0-1 requests in past year as of 2024-02 - 23)
      //   - anyactive
      //   - hasmeta
      //   - hasattribution
      //   - hasposts
      //   - hasannotations
      //   - hasdomainmetadata
      //   - hasvideos
      //   - pending
      options: [['unread', 'queue', 'archive', 'read', 'all']],
    },
  },
  offset: {
    default: {
      options: 0,
    },
    isInt: {
      options: {
        min: 0,
      },
      errorMessage: '`offset` cannot be negative',
    },
    toInt: true,
  },
  count: {
    default: {
      options: 30,
    },
    isInt: {
      options: {
        min: 1,
        max: 5000,
      },
    },
    toInt: true,
  },
  tag: {
    optional: true,
    isString: true,
    notEmpty: true,
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
  contentType: {
    optional: true,
    toLowerCase: true,
    isIn: {
      options: [['article', 'image', 'video']],
    },
  },
  favorite: {
    optional: true,
    isIn: {
      options: [['0', '1']],
    },
    customSanitizer: {
      options: (value) => (value === '1' ? true : false),
    },
  },
  search: {
    optional: true,
    isString: true,
    customSanitizer: {
      options: (value) => (value === '' ? undefined : value),
    },
  },
  sort: {
    toLowerCase: true,
    customSanitizer: {
      options: (value, { req }) => {
        // Android sends in shortest and longest, but this is not supported by legacy v3/get.
        if (['shortest', 'longest'].includes(value)) return 'newest';
        if (value) return value;
        if (req.body.search || req.query.search) {
          return 'relevance';
        }
        return 'newest';
      },
    },
    isIn: {
      options: [['newest', 'oldest', 'relevance', 'longest', 'shortest']],
    },
    custom: {
      options: (value, { req }) => {
        // Relevance only valid for search query
        if (value === 'relevance') {
          return req.body.search || req.query.search ? true : false;
        } else {
          return true;
        }
      },
    },
  },
  total: {
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
      options: '0',
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
  hasAnnotations: {
    optional: true,
    isIn: {
      options: [['0', '1']],
    },
    customSanitizer: {
      options: (value) => (value === '1' ? true : false),
    },
  },
  account: {
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
  forceaccount: {
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
};
