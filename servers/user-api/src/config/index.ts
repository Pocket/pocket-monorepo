const serviceName = 'user-api';

const tables = {
  //tables with sensitive PII
  //and tables with tokens that provides access to pocket directly
  //or through third party
  tablesWithSensitivePii: [
    'users',
    'user_google_account',
    'user_firefox_account',
    'user_twitter_auth',
    'users_social_tokens',
    'users_tokens',
    'users_services',
    'oauth_user_access',
    'push_tokens',
    'user_profile',
    'users_social_services',
  ],
  //tables with user_id and non-identifiable information
  //tables that are not responsible for getting access to pocket
  tablesWithNonSensitivePii: [
    'user_follows',
    'users_social_ids',
    'user_notifications',
    'users_meta',
    'user_setting',
    'users_device_ids',
    'users_settings_notifications',
    'users_time',
  ],
};

export default {
  app: {
    environment: process.env.NODE_ENV || 'development',
    port: 4006,
  },
  apple_migration_api_id: 107767,
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    eventBus: {
      name: process.env.EVENT_BUS_NAME || 'PocketEventBridge-Shared-Event-Bus',
      eventBridge: { source: 'user-events' },
    },
    endpoint:
      process.env.NODE_ENV != 'production' &&
      process.env.NODE_ENV != 'development'
        ? process.env.AWS_ENDPOINT || 'http://localhost:4566'
        : undefined,
  },
  database: {
    read: {
      host: process.env.DATABASE_READ_HOST || 'localhost',
      port: process.env.DATABASE_READ_PORT || '3306',
      user: process.env.DATABASE_READ_USER || 'pkt_userapi_r',
      password: process.env.DATABASE_READ_PASSWORD || '',
    },
    write: {
      host: process.env.DATABASE_WRITE_HOST || 'localhost',
      port: process.env.DATABASE_WRITE_PORT || '3306',
      user: process.env.DATABASE_WRITE_USER || 'pkt_userapi_w',
      password: process.env.DATABASE_WRITE_PASSWORD || '',
    },
    dbName: process.env.DATABASE || 'readitla_ril-tmp',
    tz: process.env.DATABASE_TZ || 'US/Central',
    userPIITables: {
      // Map of column key containing user ID to table name
      user_id: [...tables.tablesWithSensitivePii],
      created_by_user_id: ['channels'],
    },
  },
  pinpoint: {
    applicationId: process.env.PINPOINT_APPLICATION_ID || 'not-a-real-id',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  serviceName,
  tracing: {
    host: process.env.OTLP_COLLECTOR_HOST || 'localhost',
    serviceName: serviceName,
  },
  secrets: {
    contactHash: process.env.CONTACT_HASH || 'abcdefghijklmnop',
    characterMap: process.env.CHARACTER_MAP
      ? JSON.parse(process.env.CHARACTER_MAP)
      : [
          ['G', 0],
          ['Q', 0],
          ['k', 0],
          ['V', 0],
          ['X', 0],
          ['I', 0],
          ['W', 1],
          ['Y', 1],
          ['a', 1],
          ['j', 1],
          ['Z', 1],
          ['o', 1],
          ['C', 2],
          ['D', 2],
          ['Q', 2],
          ['U', 2],
          ['Z', 2],
          ['d', 3],
          ['C', 3],
          ['f', 3],
          ['g', 3],
          ['w', 3],
          ['V', 4],
          ['k', 4],
          ['n', 4],
          ['J', 4],
          ['p', 4],
          ['H', 5],
          ['Q', 5],
          ['R', 5],
          ['t', 5],
          ['x', 5],
          ['w', 6],
          ['K', 6],
          ['J', 6],
          ['P', 6],
          ['G', 6],
          ['U', 7],
          ['q', 7],
          ['Y', 7],
          ['V', 7],
          ['W', 7],
          ['H', 8],
          ['M', 8],
          ['O', 8],
          ['N', 8],
          ['I', 8],
          ['Y', 9],
          ['i', 9],
          ['o', 9],
          ['Q', 9],
          ['l', 9],
        ],
    positionMap: process.env.POSITION_MAP
      ? JSON.parse(process.env.POSITION_MAP)
      : [
          [9, 0],
          [123, 2],
          [26, 2],
          [123, 3],
          [9, 4],
          [56, 5],
          [234, 6],
          [24, 7],
          [45, 8],
          [98, 9],
          [45, 10],
          [12, 11],
          [98, 12],
          [32, 13],
          [74, 14],
          [25, 15],
        ],
    md5Randomizer: process.env.MD5_RANDOMIZER
      ? JSON.parse(process.env.MD5_RANDOMIZER)
      : [
          ['0', ['g']],
          ['1', ['g']],
          ['2', ['h']],
          ['3', ['a']],
          ['4', ['a']],
          ['5', ['3']],
          ['6', ['1']],
          ['7', ['1']],
          ['8', ['7']],
          ['9', ['k']],
          ['a', ['v']],
          ['b', ['X']],
          ['c', ['i']],
          ['d', ['f', 'T', 'q']],
          ['e', ['o']],
          ['f', ['O', 'h', 'b']],
        ],
    letterIndex: process.env.LETTER_INDEX
      ? JSON.parse(process.env.LETTER_INDEX)
      : [
          ['a', 7],
          ['b', 2],
          ['c', 8],
          ['d', 9],
          ['e', 1],
          ['f', 0],
          ['0', 9],
        ],
    salt1: process.env.SALT_1 || '123asdf',
    salt2: process.env.SALT_2 || 'asdaa47',
  },
};
