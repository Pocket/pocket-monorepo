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

const awsEnvironments = ['production', 'development'];
let localAwsEndpoint: string = undefined;
if (!awsEnvironments.includes(process.env.NODE_ENV)) {
  localAwsEndpoint = process.env.AWS_ENDPOINT || 'http://localhost:4566';
}

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
    intMask: {
      characterMap: process.env.CHARACTER_MAP
        ? new Map<string, number>(JSON.parse(process.env.CHARACTER_MAP))
        : new Map<string, number>([
            ['A', 0],
            ['B', 0],
            ['C', 0],
            ['D', 0],
            ['E', 0],
            ['y', 0],
            ['F', 1],
            ['G', 1],
            ['H', 1],
            ['I', 1],
            ['J', 1],
            ['z', 1],
            ['K', 2],
            ['L', 2],
            ['M', 2],
            ['N', 2],
            ['O', 2],
            ['P', 3],
            ['Q', 3],
            ['R', 3],
            ['S', 3],
            ['T', 3],
            ['U', 4],
            ['V', 4],
            ['W', 4],
            ['X', 4],
            ['Y', 4],
            ['Z', 5],
            ['a', 5],
            ['b', 5],
            ['c', 5],
            ['d', 5],
            ['e', 6],
            ['f', 6],
            ['g', 6],
            ['h', 6],
            ['i', 6],
            ['j', 7],
            ['k', 7],
            ['l', 7],
            ['m', 7],
            ['n', 7],
            ['o', 8],
            ['p', 8],
            ['q', 8],
            ['r', 8],
            ['s', 8],
            ['t', 9],
            ['u', 9],
            ['v', 9],
            ['w', 9],
            ['x', 9],
          ]),
      positionMap: process.env.POSITION_MAP
        ? new Map<number, number>(JSON.parse(process.env.POSITION_MAP))
        : new Map<number, number>([
            [9, 0],
            [12, 1],
            [26, 2],
            [59, 3],
            [45, 4],
            [56, 5],
            [23, 6],
            [42, 7],
            [48, 8],
            [18, 9],
            [40, 10],
            [10, 11],
            [37, 12],
            [32, 13],
            [21, 14],
            [16, 15],
          ]),
      md5Randomizer: process.env.MD5_RANDOMIZER
        ? new Map<string, string[]>(JSON.parse(process.env.MD5_RANDOMIZER))
        : new Map<string, string[]>([
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
          ]),
      letterIndex: process.env.LETTER_INDEX
        ? new Map<string, number>(JSON.parse(process.env.LETTER_INDEX))
        : new Map<string, number>([
            ['a', 7],
            ['b', 2],
            ['c', 8],
            ['d', 9],
            ['e', 1],
            ['f', 0],
            ['0', 9],
          ]),
      salt1: process.env.SALT_1 || '123asdf',
      salt2: process.env.SALT_2 || 'asdaa47',
    },
  },
};
