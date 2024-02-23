const awsEnvironments = ['production', 'development'];
let localAwsEndpoint: string = undefined;
if (!awsEnvironments.includes(process.env.NODE_ENV)) {
  localAwsEndpoint = process.env.AWS_ENDPOINT || 'http://localhost:4566';
}

export const config = {
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
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
    },
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  }
};
