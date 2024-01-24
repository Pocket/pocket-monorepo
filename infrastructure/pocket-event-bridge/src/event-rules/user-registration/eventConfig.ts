import { config as globalConfig } from '../../config';

export const eventConfig = {
  name: 'UserRegistration',
  source: 'web-repo',
  detailType: ['User Registration'],
  bus: globalConfig.sharedEventBusName,
};
