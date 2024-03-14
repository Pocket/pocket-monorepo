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
};
