const serviceName = 'user-api';

const tables = {
  //tables with sensitive PII
  //and tables with tokens that provides access to pocket directly
  //or through third party
  tablesWithSensitivePii: [
    'users',
    'user_google_account',
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

const awsEnvironments = ['production', 'development'];
const localAwsEndpoint =
  process.env.NODE_ENV && !awsEnvironments.includes(process.env.NODE_ENV)
    ? process.env.AWS_ENDPOINT || 'http://localhost:4566'
    : undefined;

export default {
  app: {
    serviceName,
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
    endpoint: localAwsEndpoint,
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
    // For test seeds
    userPIITestSeedTables: {
      user_id: [...tables.tablesWithSensitivePii, 'user_firefox_account'],
      created_by_user_id: ['channels'],
    },
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
    samplerFlag: 'perm.backend.sentry-trace-sampler-rate',
  },
  serviceName,
  tracing: {
    url: process.env.OTLP_COLLECTOR_URL || 'http://localhost:4318',
    serviceName: serviceName,
    release: process.env.GIT_SHA || 'local',
  },
  unleash: {
    clientKey: process.env.UNLEASH_KEY || 'unleash-key-fake',
    endpoint: process.env.UNLEASH_ENDPOINT || 'http://localhost:4242/api',
    refreshInterval: 60 * 1000, // ms
    timeout: 2 * 1000, // ms
  },
  secrets: {
    contactHash: process.env.CONTACT_HASH || 'abcdefghijklmnop',
  },
};
