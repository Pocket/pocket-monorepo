import { Schema } from 'express-validator';
import { timeSeconds } from './shared';
/**
 * Note: this type is manually documented, since the
 * Schema validator doesn't infer types.
 */
export type V3GetParams = {
  access_token?: string;
  consumer_key: string;
  contentType?: 'article' | 'image' | 'video' | 'all';
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
  premium: boolean;
  forcepremium: boolean;
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
  tag: {
    optional: true,
    isString: true,
    notEmpty: true,
  },
  since: {
    optional: true,
    toInt: true,
    custom: {
      options: (since) => (since < 0 ? false : true),
    },
    customSanitizer: {
      options: (value) => timeSeconds(value),
    },
  },
  count: {
    toInt: true,
    customSanitizer: {
      options: (value, { req }) => {
        const hasSince =
          req.body.since != null || req.query?.since != null ? true : false;
        // Android client does not paginate results for 'since'
        if (value == null || value === '' || Number.isNaN(value)) {
          if (hasSince) {
            return 5000;
          } else {
            return 30;
          }
        }
        return value;
      },
    },
    isInt: {
      options: {
        min: 1,
        max: 5000,
      },
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
  contentType: {
    optional: true,
    toLowerCase: true,
    isIn: {
      options: [['article', 'image', 'video', 'all']],
    },
  },
  favorite: {
    optional: true,
    isIn: {
      options: [['0', '1', true, false, 'true', 'false']],
    },
    customSanitizer: {
      options: (value) =>
        value === '1' || value === true || value === 'true' ? true : false,
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
        const isSearch = req.body.search || req.query?.search ? true : false;
        // No value was passed
        if (value == null) {
          // If searching, default to relevance
          if (isSearch) return 'relevance';
          // Otherwise default to newest
          return 'newest';
        }
        // A value was passed - apply conditional validation

        // Android sends in shortest and longest,
        // but this is not supported. Default to 'newest'.
        if (['shortest', 'longest'].includes(value)) {
          return isSearch ? 'relevance' : 'newest';
        }
        // Default to 'newest' if 'relevance' is passed,
        // but search term is omitted or invalid
        if (value === 'relevance') {
          return isSearch ? value : 'newest';
        }
        // Otherwise the value passes
        return value;
      },
    },
    isIn: {
      options: [['newest', 'oldest', 'relevance', 'longest', 'shortest']],
    },
  },
  total: {
    default: {
      options: '0',
    },
    isIn: {
      options: [['0', '1', true, false, 'true', 'false']],
    },
    customSanitizer: {
      options: (value) =>
        value === '1' || value === true || value === 'true' ? true : false,
    },
  },
  annotations: {
    default: {
      options: '0',
    },
    isIn: {
      options: [['0', '1', true, false, 'true', 'false']],
    },
    customSanitizer: {
      options: (value) =>
        value === '1' || value === true || value === 'true' ? true : false,
    },
  },
  taglist: {
    default: {
      options: '0',
    },
    isIn: {
      options: [['0', '1', true, false, 'true', 'false']],
    },
    customSanitizer: {
      options: (value) =>
        value === '1' || value === true || value === 'true' ? true : false,
    },
  },
  forcetaglist: {
    default: {
      options: '0',
    },
    isIn: {
      options: [['0', '1', true, false, 'true', 'false']],
    },
    customSanitizer: {
      options: (value) =>
        value === '1' || value === true || value === 'true' ? true : false,
    },
  },
  hasAnnotations: {
    optional: true,
    isIn: {
      options: [['0', '1', true, false, 'true', 'false']],
    },
    customSanitizer: {
      options: (value) =>
        value === '1' || value === true || value === 'true' ? true : false,
    },
  },
  account: {
    default: {
      options: '0',
    },
    isIn: {
      options: [['0', '1', true, false, 'true', 'false']],
    },
    customSanitizer: {
      options: (value) =>
        value === '1' || value === true || value === 'true' ? true : false,
    },
  },
  forceaccount: {
    default: {
      options: '0',
    },
    isIn: {
      options: [['0', '1', true, false, 'true', 'false']],
    },
    customSanitizer: {
      options: (value) =>
        value === '1' || value === true || value === 'true' ? true : false,
    },
  },
  premium: {
    default: {
      options: '0',
    },
    isIn: {
      options: [['0', '1', true, false, 'true', 'false']],
    },
    customSanitizer: {
      options: (value) =>
        value === '1' || value === true || value === 'true' ? true : false,
    },
  },
  forcepremium: {
    default: {
      options: '0',
    },
    isIn: {
      options: [['0', '1', true, false, 'true', 'false']],
    },
    customSanitizer: {
      options: (value) =>
        value === '1' || value === true || value === 'true' ? true : false,
    },
  },
};
