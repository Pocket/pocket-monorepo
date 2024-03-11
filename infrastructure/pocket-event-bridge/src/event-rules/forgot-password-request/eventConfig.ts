import { config as globalConfig } from '../../config';

export const eventConfig = {
  name: 'ForgotPasswordRequest',
  source: 'web-repo',
  detailType: ['Forgot Password Request'],
  bus: globalConfig.sharedEventBusName,
};
