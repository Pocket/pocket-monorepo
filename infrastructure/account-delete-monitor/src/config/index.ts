const name = 'AccountDeleteMonitor';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';

export const config = {
  name,
  isDev,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'ADM',
  environment,
  lambda: {
    reservedConcurrencyLimit: 10,
  },
  userApi: {
    prodUrl: 'https://user-api.readitlater.com',
  },
  eventBridge: {
    prefix: 'PocketEventBridge',
    userTopic: 'UserEvents',
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
    owner: 'Pocket',
    costCenter: 'Pocket',
    app_code: 'pocket',
    component_code: `pocket-${name.toLowerCase()}`,
    env_code: isDev ? 'dev' : 'prod',
  },
};
