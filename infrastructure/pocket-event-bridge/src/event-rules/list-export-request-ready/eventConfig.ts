import { config as globalConfig } from '../../config';

export const eventConfig = {
  name: 'ListExportReady',
  source: 'account-data-deleter',
  detailType: ['list-export-ready'],
  bus: globalConfig.sharedEventBusName,
};
