import {
  GetSecretValueCommand,
  GetSecretValueResponse,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

const awsEnvironments = ['production', 'development'];
let localAwsEndpoint: string = undefined;
if (!awsEnvironments.includes(process.env.NODE_ENV)) {
  localAwsEndpoint = process.env.AWS_ENDPOINT || 'http://localhost:4566';
}

export const config = {
  ecsMySqlConfig: {
    readitla:
      process.env.READITLA_DB ||
      '{"password":"","dbname":"readitla_ril-tmp","engine":"mysql","port":"3306","host":"localhost","username":"pkt_listserch_r"}',
  },
  mysql: {
    readitla: {
      connectionLimit: 10,
      dateStrings: true,
    },
    contentAuroraDb: {
      connectionLimit: 10,
      dateStrings: true,
    },
    timezone: process.env.DATABASE_TZ || 'US/Central',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    elasticsearch: {
      host:
        process.env.ELASTICSEARCH_HOST ||
        'http://localhost:4566/user-list-search',
      apiVersion: '7.1',
      index: process.env.ELASTICSEARCH_INDEX || 'list',
      type: process.env.ELASTICSEARCH_TYPE || '_doc',
      defaultQueryScore: process.env.ELASTICSEARCH_DEFAULT_QUERY_SCORE || 1,
      maxRetries: 3,
      deleteConfig: {
        slices: 100,
      },
    },
    sqs: {
      waitTimeSeconds: 20,
      endpoint: localAwsEndpoint,
      userItemsUpdateUrl:
        process.env.SQS_USER_ITEMS_UPDATE_URL ||
        'http://localhost:4566/000000000000/UserListSearch-Dev-UserItemsUpdate',
      userItemsDeleteUrl:
        process.env.SQS_USER_ITEMS_DELETE_URL ||
        'http://localhost:4566/000000000000/UserListSearch-Dev-UserItemsDelete',
      userListImportUrl:
        process.env.SQS_USER_LIST_IMPORT_URL ||
        'http://localhost:4566/000000000000/UserListSearch-Dev-UserListImport',
      userListImportBackfillUrl:
        process.env.SQS_USER_LIST_IMPORT_BACKFILL_URL ||
        'http://localhost:4566/000000000000/UserListSearch-Dev-UserListImportBackfill',
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
};

export type MySqlConfigFromSecrets = {
  username: string;
  password: string;
  host: string;
  dbname: string;
};

export type MySqlConfig = {
  user: string;
  password: string;
  host: string;
  database: string;
};

export const getSecret = async (secretName: string): Promise<string> => {
  const secretsManager = new SecretsManagerClient();
  const data: GetSecretValueResponse = await secretsManager.send(
    new GetSecretValueCommand({ SecretId: secretName }),
  );
  return data.SecretString as string;
};

export const getMysqlConfigFromString = (str: string): MySqlConfig => {
  const obj = JSON.parse(str) as MySqlConfigFromSecrets;

  return {
    database: obj.dbname,
    password: obj.password,
    host: obj.host,
    user: obj.username,
  };
};

const getMysqlConfigFromEnv = (name: string): MySqlConfig => {
  const str = process.env[name];

  return str != undefined && str ? getMysqlConfigFromString(str) : null;
};

const getMysqlConfigFromSecretsManager = async (
  path: string,
): Promise<MySqlConfig> => {
  try {
    return getMysqlConfigFromString(await getSecret(path));
  } catch {
    return null;
  }
};

export default async (): Promise<typeof config> => {
  let [readitla, contentAuroraDb] = await Promise.all([
    getMysqlConfigFromEnv('READITLA_DB') ??
      getMysqlConfigFromSecretsManager(
        process.env.READITLA_DB_SECRET_PATH ||
          'UserListSearch/Prod/DatabaseCredentials',
      ),
    getMysqlConfigFromEnv('CONTENT_AURORA_DB') ??
      getMysqlConfigFromSecretsManager(
        process.env.PARSER_AURORA_DB_SECRET_PATH ||
          'UserListSearch/Prod/ParserAuroraDbCredentials',
      ),
  ]);
  const cfg = { ...config };

  (readitla = readitla ?? {
    database: 'readitla_ril-tmp',
    password: '',
    user: 'pkt_listserch_r',
    host: 'localhost',
  }), // fall back to local test environment
    (contentAuroraDb = contentAuroraDb ?? {
      database: 'content',
      password: '',
      user: 'pkt_listserch_r',
      host: 'localhost',
    }), // fall back to local test environment,
    (cfg.mysql.readitla = { ...readitla, ...cfg.mysql.readitla });
  cfg.mysql.contentAuroraDb = {
    ...contentAuroraDb,
    ...cfg.mysql.contentAuroraDb,
  };

  return cfg;
};
