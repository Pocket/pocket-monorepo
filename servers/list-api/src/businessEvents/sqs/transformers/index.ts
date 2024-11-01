import { ItemEventPayload, SQSEvents } from '../../types';
import config from '../../../config';
import { mysqlTimeString } from '../../../dataService/utils';
import * as Sentry from '@sentry/node';

export type EventTransFormer = {
  transformer: (data: ItemEventPayload) => Promise<any>;
  queueUrl: string;
  events: string[];
};

export const transformers: EventTransFormer[] = [
  {
    transformer: publisherDataSqsTransformer,
    queueUrl: config.aws.sqs.publisherQueue.url,
    events: config.aws.sqs.publisherQueue.events,
  },
  {
    transformer: permLibSqsTransformer,
    queueUrl: config.aws.sqs.permLibItemMainQueue.url,
    events: config.aws.sqs.permLibItemMainQueue.events,
  },
];

/**
 * Transform the saved item event into a publisher data queue SQS message
 * @param data
 */
export async function publisherDataSqsTransformer(data: ItemEventPayload) {
  const action = SQSEvents[data.eventType];

  if (!action) return null;

  Sentry.addBreadcrumb({
    message: `action ${action}; userId: ${parseInt(data.user.id)} `,
  });

  return {
    action: action,
    user_id: parseInt(data.user.id),
    item_id: parseInt((await data.savedItem).id),
    timestamp: data.timestamp,
    api_id: parseInt(data.apiUser.apiId),
  };
}

/**
 * Transform the saved item event into a perm lib SQS message
 * @param data
 */
export async function permLibSqsTransformer(data: ItemEventPayload) {
  if (!data.user.isPremium) return null;

  const savedItem = await data.savedItem;
  return {
    userId: parseInt(data.user.id),
    itemId: parseInt(savedItem.id),
    givenUrl: savedItem.url,
    timeAdded: savedItem._createdAt
      ? mysqlTimeString(
          new Date(savedItem._createdAt * 1000),
          config.database.tz,
        )
      : null,
    resolvedId: savedItem.resolvedId,
  };
}
