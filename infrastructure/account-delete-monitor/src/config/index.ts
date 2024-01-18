const name = 'AccountDeleteMonitor';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const githubConnectionArn = isDev
  ? 'arn:aws:codestar-connections:us-east-1:410318598490:connection/7426c139-1aa0-49e2-aabc-5aef11092032'
  : 'arn:aws:codestar-connections:us-east-1:996905175585:connection/5fa5aa2b-a2d2-43e3-ab5a-72ececfc1870';
const branch = isDev ? 'dev' : 'main';

export const config = {
  name,
  isDev,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'ADM',
  environment,
  codePipeline: {
    githubConnectionArn,
    repository: 'pocket/account-delete-monitor',
    branch,
  },
  lambda: {
    reservedConcurrencyLimit: 10,
  },
  userApi: {
    prodUrl: 'https://user-api.readitlater.com',
  },
  eventBridge: {
    prefix: 'PocketEventBridge',
    userTopic: 'UserEventTopic',
    //already created in pocket-event-bridge repo
    userMergeTopic: 'UserMerge-Topic',
  },
  dynamodb: {
    deleteEventTable: {
      key: 'id',
    },
  },
  tags: {
    service: name,
    environment,
  },
};
