const name = 'InstantSyncEvents';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';

export const config = {
  name,
  isDev,
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
  },
};
