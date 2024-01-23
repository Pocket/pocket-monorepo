import { config as globalConfig } from '../../config';

export const config = {
  queueCheckDelete: {
    scheduleExpression: 'cron(15 10 * * ? *)', // 03:15 PT every day
    name: 'EventTracker',
    schema: 'queue-check-delete',
    //scheduled events are supported by default bus only.
    bus: 'default',
  },
  userMerge: {
    name: 'UserMerge',
    schema: 'user-merge',
    //defined in web repo under UserMergeEvent class
    //todo: swap after replaying events.
    source: 'user-merge',
    detailType: ['web-repo'],
    bus: globalConfig.sharedEventBusName,
  },
  prefix: `AccountDeleteMonitor-${globalConfig.environment}`,
};
