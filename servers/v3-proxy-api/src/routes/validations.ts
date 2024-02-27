import { Schema } from 'express-validator';

export type V3GetQuery = {
  access_token?: string;
  consumer_key?: string;
  contentType?: 'article' | 'image';
  count: number;
  favorite?: boolean;
  offset: number;
  since?: number;
  sort: 'newest' | 'oldest'; //| 'relevance';
  state?: 'unread' | 'read' | 'archive' | 'queue';
  tag?: string;
  type: 'simple' | 'complete';
};

export const getQuerySchema: Schema = {
  access_token: {
    optional: true,
    isString: true,
    notEmpty: {
      errorMessage: 'access_token cannot be empty string',
    },
  },
  consumer_key: {
    optional: true,
    isString: true,
    notEmpty: {
      errorMessage: 'consumer_key cannot be empty string',
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
      options: [['unread', 'queue', 'archive', 'read']],
      errorMessage: 'invalid value for state',
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
      errorMessage: 'offset cannot be negative',
    },
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
      errorMessage: 'invalid value for count',
    },
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
  },
  contentType: {
    optional: true,
    toLowerCase: true,
    isIn: {
      options: [['article', 'image']],
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
  sort: {
    default: {
      options: 'newest',
    },
    toLowerCase: true,
    isIn: {
      options: [['newest', 'oldest']], //, 'relevance']],
    },
  },
};
