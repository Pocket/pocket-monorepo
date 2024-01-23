import { config as globalConfig } from '../../config';

export const eventConfig = {
  name: 'PremiumPurchase',
  source: 'web-repo',
  detailType: ['Premium Purchase'],
  bus: globalConfig.sharedEventBusName,
};
