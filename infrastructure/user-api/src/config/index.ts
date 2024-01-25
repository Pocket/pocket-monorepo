const name = 'UserAPI';
const domainPrefix = 'user-api';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const graphqlVariant = isDev ? 'development' : 'current';
const pinpointApplicationId = isDev
  ? '6458063ecdc74e4eac884ee18933cd6a'
  : '5c59691a6a7b421c9eef4467fb61d499';
const eventBusName = `PocketEventBridge-${environment}-Shared-Event-Bus`;
const releaseSha = process.env.CIRCLE_SHA1;

export const config = {
  name,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'USRAPI',
  releaseSha,
  environment,
  domain,
  graphqlVariant,
  database: {
    port: '3306',
  },
  envVars: {
    pinpointApplicationId,
    eventBusName,
  },
  tags: {
    service: name,
    environment,
  },
  tracing: {
    host: 'localhost',
  },
};
