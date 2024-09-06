const awsEnvironments = ['production', 'development'];
let localAwsEndpoint: string = undefined;
if (!awsEnvironments.includes(process.env.NODE_ENV)) {
  localAwsEndpoint = process.env.AWS_ENDPOINT || 'http://localhost:4566';
}

export const config = {
  serviceName: 'user-list-search',
  tracing: {
    host: process.env.OTLP_COLLECTOR_HOST || 'localhost',
  },
  app: {
    environment: process.env.NODE_ENV || 'development',
    port: 4000,
  },
  mysql: {
    timezone: process.env.DATABASE_TZ || 'US/Central',
    readitla:
      process.env.READITLA_DB ||
      '{"password":"","dbname":"readitla_ril-tmp","engine":"mysql","port":"3306","host":"localhost","username":"pkt_listserch_r"}',
    readitla_w:
      process.env.READITLA_DB_W ||
      '{"password":"","dbname":"readitla_ril-tmp","engine":"mysql","port":"3306","host":"localhost","username":"pkt_listserch_w"}',
    content:
      process.env.CONTENT_AURORA_DB ||
      '{"password":"","dbname":"content","engine":"mysql","port":"3306","host":"localhost","username":"pkt_listserch_r"}',
  },
  parser: {
    privilegedServiceId:
      process.env.PARSER_PRIVILEGED_SERVICE_ID || 'my-needs-matter',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    elasticsearch: {
      host:
        process.env.ELASTICSEARCH_HOST ||
        'http://localhost:4566/user-list-search',
      apiVersion: '7.1',
      list: {
        index: process.env.ELASTICSEARCH_INDEX || 'list',
        type: process.env.ELASTICSEARCH_TYPE || '_doc',
        defaultQueryScore: process.env.ELASTICSEARCH_DEFAULT_QUERY_SCORE || 1,
        deleteConfig: {
          slices: 100,
        },
      },
      corpus: {
        host:
          process.env.CORPUS_SEARCH_HOST ||
          'http://localhost:4566/user-list-search',
        index: {
          // language-specific corpus indices
          en: process.env.CORPUS_INDEX_EN || 'corpus_en',
          es: process.env.CORPUS_INDEX_ES || 'corpus_es',
          de: process.env.CORPUS_INDEX_DE || 'corpus_de',
          fr: process.env.CORPUS_INDEX_FR || 'corpus_fr',
          it: process.env.CORPUS_INDEX_IT || 'corpus_it',
        },
      },
      maxRetries: 3,
    },
    sqs: {
      waitTimeSeconds: 20,
      endpoint: localAwsEndpoint,
      userItemsUpdateUrl:
        process.env.SQS_USER_ITEMS_UPDATE_URL ||
        'http://localhost:4566/000000000000/UserListSearch-Dev-UserItemsUpdate',
      userItemsUpdateBackfillUrl:
        process.env.SQS_USER_ITEMS_UPDATE_BACKFILL_URL ||
        'http://localhost:4566/000000000000/UserListSearch-Dev-UserItemsUpdateBackfill',
      userListImportBackfillUrl:
        process.env.SQS_USER_LIST_IMPORT_BACKFILL_URL ||
        'http://localhost:4566/000000000000/UserListSearch-Dev-UserListImportBackfill',
    },
    eventBus: {
      name:
        process.env.EVENT_BUS_NAME || 'PocketEventBridge-Dev-Shared-Event-Bus',
      source: 'search-api-events',
    },
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  isProduction: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV || 'development',
  pagination: {
    defaultPageSize: 30,
    maxPageSize: 100,
  },
  unleash: {
    clientKey: process.env.UNLEASH_KEY || 'unleash-key-fake',
    endpoint: process.env.UNLEASH_ENDPOINT || 'http://localhost:4242/api',
    refreshInterval: 60 * 1000, // ms
    timeout: 2 * 1000, // ms
    namePrefix: 'temp.backend',
    flags: {
      corpusExplore: {
        name: 'temp.backend.explore_the_corpus',
        fallback: false,
      },
    },
  },
};
