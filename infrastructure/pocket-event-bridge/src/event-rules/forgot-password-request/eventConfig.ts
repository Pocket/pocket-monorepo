import { config as globalConfig } from '../../config/index.js';

export const eventConfig = {
  name: 'ForgotPasswordRequest',
  source: 'web-repo',
  detailType: ['Forgot Password Request'],
  bus: globalConfig.sharedEventBusName,
};
