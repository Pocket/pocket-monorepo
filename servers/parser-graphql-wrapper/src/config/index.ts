export default {
  // Same as domain prefix in .aws/src/config
  serviceName: 'parser-graphql-wrapper',
  tracing: {
    graphQLDepth: 8, // very permissive limit on depth tracing
    samplingRatio: 0.2,
    grpcDefaultPort: 4317,
    httpDefaultPort: 4318,
    serviceName: 'parser-graphql-wrapper',
    host: process.env.OTLP_COLLECTOR_HOST || 'localhost',
  },
  app: {
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 21100, // ~6 hours
    serverPort: 4001,
  },
  redis: {
    primaryEndpoint: process.env.REDIS_PRIMARY_ENDPOINT || 'localhost',
    readerEndpoint: process.env.REDIS_READER_ENDPOINT || 'localhost',
    port: process.env.REDIS_PORT ?? '6379',
    isCluster: process.env.REDIS_IS_CLUSTER
      ? JSON.parse(process.env.REDIS_IS_CLUSTER)
      : false,
    isTLS: process.env.REDIS_IS_TLS
      ? JSON.parse(process.env.REDIS_IS_TLS)
      : false,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  shortUrl: {
    apiId: 106698, //braze consumer
    userId: 59868094, //test user account
    serviceId: 10, //arbitary value for now
    //data fetched from: Web/symfony_config/.env
    //https://github.com/Pocket/Web/blob/16a0b582dfbd443d18f96f0f54163a9d50f3f6ab/symfony_config/.env#L160
    short_prefix: process.env.SHORT_PREFIX || 'local.co/b',
    short_prefix_secure: process.env.SHORT_PREFIX_SECURE || 'local.co/a',
    shortCodeChars:
      process.env.SHORT_CODE_CHARS ||
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ123456789_',
    collectionUrl:
      process.env.COLLECTIONS_URL || 'https://getpocket.com/collections',
  },
  mysql: {
    host: process.env.DB_HOST || 'localhost',
    port: 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
  },
  pocketSharedRds: {
    host: process.env.POCKET_SHARES_DATABASE_WRITE_HOST || 'localhost',
    port: 3306,
    username: process.env.POCKET_SHARES_DATABASE_WRITE_USER || 'root',
    password: process.env.POCKET_SHARES_DATABASE_WRITE_PASSWORD || '',
  },
  parserEndpoint: process.env.PARSER_URL || 'http://example-parser.com/',
  parserRetries: 3,
  intMask: {
    characterMap: process.env.CHARACTER_MAP
      ? new Map<string, number>(JSON.parse(process.env.CHARACTER_MAP))
      : new Map<string, number>([
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
        ]),
    positionMap: process.env.POSITION_MAP
      ? new Map<number, number>(JSON.parse(process.env.POSITION_MAP))
      : new Map<number, number>([
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
};
