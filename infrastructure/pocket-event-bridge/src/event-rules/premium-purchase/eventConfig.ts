import { config as globalConfig } from '../../config/index.js';

export const eventConfig = {
  name: 'PremiumPurchase',
  source: 'web-repo',
  detailType: ['Premium Purchase'],
  bus: globalConfig.sharedEventBusName,
};
