const config = {
  AWS_ACCESS_KEY_ID: 'localstack-UserListSearch-user',
  AWS_REGION: 'us-east-1',
  AWS_SECRET_ACCESS_KEY: 'localstack-UserListSearch-key',
  AWS_APP_ENV: 'test',
  AWS_APP_NAME: 'UserListSearch',
  AWS_APP_PREFIX: 'UserListSearch-Dev',
  AWS_SQS_BASE_URL: 'http://localstack:4566/000000000000/',
  AWS_SQS_ENDPOINT: 'http://localstack:4566',
  NODE_ENV: 'test',
  SQS_USER_ITEMS_DELETE_URL:
    'http://localstack:4566/000000000000/UserListSearch-Dev-UserItemsDelete',
  SQS_USER_ITEMS_UPDATE_URL:
    'http://localstack:4566/000000000000/UserListSearch-Dev-UserItemsUpdate',
  SQS_USER_LIST_IMPORT_URL:
    'http://localstack:4566/000000000000/UserListSearch-Dev-UserListImport',

  ELASTICSEARCH_DOMAIN: 'user-list-search',
  ELASTICSEARCH_HOST: 'http://localstack:4571',
  ELASTICSEARCH_INDEX: 'list',
  ELASTICSEARCH_TYPE: '_doc',
  READITLA_DB:
    '{"password":"","dbname":"readitla_ril-tmp","engine":"mysql","port":"3306","host":"mysql","username":"root"}',
  CONTENT_AURORA_DB:
    '{"password":"","dbname":"content","engine":"mysql","port":"3306","host":"mysql","username":"root"}',
  GIT_SHA: 'local',
  MEMCACHED_HOSTS: 'memcached:11211',
  SENTRY_DSN: '',
  AWS_XRAY_CONTEXT_MISSING: 'LOG_ERROR',
  AWS_XRAY_LOG_LEVEL: 'silent',
};

module.exports = async () => {
  // ...
  // Set reference to current env variables in order to restore them during teardown.
  global.__ENV__ = Object.assign({}, process.env);
  for (const [key, val] of Object.entries(config)) {
    process.env[key] = val;
  }
};
