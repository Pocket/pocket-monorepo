const name = 'InstantSyncEvents';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const pushQueueName = 'pocket-push-queue';
const databaseSecretName = isDev
  ? 'InstantSyncEvents/Dev/READITLA_DB'
  : 'InstantSyncEvents/Prod/READITLA_DB';

export const config = {
  name,
  isDev,
  databaseSecretName,
  pushQueueName,
  prefix: `${name}-${environment}`,
  shortName: 'ISE',
  environment,
  eventBridge: {
    prefix: 'PocketEventBridge',
    listEventTopic: 'ListEventTopic',
  },
  tags: {
    service: name,
    environment,
    owner: 'Pocket',
    costCenter: 'Pocket',
  },
};
