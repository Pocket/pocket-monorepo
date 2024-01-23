const name = 'PocketEventBridge';
const nameLower = 'pocket-event-bridge';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';

export const config = {
  name,
  isDev,
  nameLower,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'PKT_EB',
  environment,
  sharedEventBusName: `${name}-${environment}-Shared-Event-Bus`,
  tags: {
    service: name,
    environment,
  },
};
