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
      name:
        process.env.EVENT_BUS_NAME || 'PocketEventBridge-Dev-Shared-Event-Bus',
      eventBridge: { source: 'user-events' },
    },
  },
  database: {
    read: {
      host: process.env.DATABASE_READ_HOST || 'localhost',
      port: process.env.DATABASE_READ_PORT || '3310',
      user: process.env.DATABASE_READ_USER || 'root',
      password: process.env.DATABASE_READ_PASSWORD || '',
    },
    write: {
      host: process.env.DATABASE_WRITE_HOST || 'localhost',
      port: process.env.DATABASE_WRITE_PORT || '3310',
      user: process.env.DATABASE_WRITE_USER || 'root',
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
    host: process.env.OTLP_COLLECTOR_HOST || 'otlpcollector',
    graphQLDepth: 8,
    samplingRatio: 0.2,
    grpcDefaultPort: 4317,
    httpDEfaultPort: 4318,
  },
  secrets: {
    contactHash: process.env.CONTACT_HASH || 'abcdefghijklmnop',
    characterMap: process.env.CHARACTER_MAP
      ? JSON.parse(process.env.CHARACTER_MAP)
      : [
          [2, 7],
          [4, 1],
        ],
    positionMap: process.env.POSITION_MAP
      ? JSON.parse(process.env.POSITION_MAP)
      : [
          ['a', 0],
          ['m', 0],
          ['l', 0],
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
          ['h', 0],
          ['a', 1],
          ['j', 2],
          ['a', 3],
          ['j', 4],
          ['k', 5],
          ['l', 6],
        ],
    salt1: process.env.SALT_1 || 'asbsd-4',
    salt2: process.env.SALT_2 || 'jhsdf-8',
  },
};
