import { config as globalConfig } from '../../config';

export const eventConfig = {
  name: 'ForgotPassword',
  source: 'web-repo',
  detailType: ['ForgotPassword'],
  bus: globalConfig.sharedEventBusName,
};
