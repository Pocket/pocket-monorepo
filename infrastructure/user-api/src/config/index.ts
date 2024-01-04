const name = 'UserAPI';
const domainPrefix = 'user-api';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const graphqlVariant = isDev ? 'development' : 'current';
const githubConnectionArn = isDev
  ? 'arn:aws:codestar-connections:us-east-1:410318598490:connection/7426c139-1aa0-49e2-aabc-5aef11092032'
  : 'arn:aws:codestar-connections:us-east-1:996905175585:connection/5fa5aa2b-a2d2-43e3-ab5a-72ececfc1870';
const pinpointApplicationId = isDev
  ? '6458063ecdc74e4eac884ee18933cd6a'
  : '5c59691a6a7b421c9eef4467fb61d499';
const branch = isDev ? 'dev' : 'main';
const eventBusName = `PocketEventBridge-${environment}-Shared-Event-Bus`;

export const config = {
  name,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'USRAPI',

  environment,
  domain,
  graphqlVariant,
  codePipeline: {
    githubConnectionArn,
    repository: 'pocket/user-api',
    branch,
  },
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
