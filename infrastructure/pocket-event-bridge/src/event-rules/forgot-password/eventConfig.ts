import { config as globalConfig } from '../../config';

export const eventConfig = {
  name: 'ForgotPassword',
  source: 'web-repo',
  detailType: ['Forgot Password Request'],
  bus: globalConfig.sharedEventBusName,
};
