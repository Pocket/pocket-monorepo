import { GetSecretValueResponse } from 'aws-sdk/clients/secretsmanager';
import AWS from 'aws-sdk';

export const config = {
  ecsMySqlConfig: {
    readitla: process.env.READITLA_DB,
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
    region: process.env.AWS_REGION,
    elasticsearch: {
      host: process.env.ELASTICSEARCH_HOST || 'testing.domain',
      apiVersion: '7.1',
      domain: process.env.ELASTICSEARCH_DOMAIN,
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
      endpoint: process.env.AWS_SQS_ENDPOINT,
      userItemsUpdateUrl: process.env.SQS_USER_ITEMS_UPDATE_URL,
      userItemsDeleteUrl: process.env.SQS_USER_ITEMS_DELETE_URL,
      userListImportUrl: process.env.SQS_USER_LIST_IMPORT_URL,
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
  const options: AWS.SecretsManager.ClientConfiguration = {};
  const secretsManager = new AWS.SecretsManager(options);
  const data: GetSecretValueResponse = await secretsManager
    .getSecretValue({ SecretId: secretName })
    .promise();
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

  return str ? getMysqlConfigFromString(str) : null;
};

const getMysqlConfigFromSecretsManager = async (
  path: string
): Promise<MySqlConfig> => {
  return getMysqlConfigFromString(await getSecret(path));
};

export default async (): Promise<Record<string, unknown>> => {
  const [readitla, contentAuroraDb] = await Promise.all([
    getMysqlConfigFromEnv('READITLA_DB') ??
      getMysqlConfigFromSecretsManager(
        process.env.READITLA_DB_SECRET_PATH ||
          'UserListSearch/Prod/DatabaseCredentials'
      ),
    getMysqlConfigFromEnv('CONTENT_AURORA_DB') ??
      getMysqlConfigFromSecretsManager(
        process.env.PARSER_AURORA_DB_SECRET_PATH ||
          'UserListSearch/Prod/ParserAuroraDbCredentials'
      ),
  ]);
  const cfg = { ...config };
  cfg.mysql.readitla = { ...readitla, ...cfg.mysql.readitla };
  cfg.mysql.contentAuroraDb = {
    ...contentAuroraDb,
    ...cfg.mysql.contentAuroraDb,
  };

  return cfg;
};
