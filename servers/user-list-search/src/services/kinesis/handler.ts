import {
  SqsMessage,
  UserItemsSqsMessage,
  UserListImportSqsMessage,
} from '../../shared';
import SqsWritable from '../../sqs/writeable';
import _ from 'highland';
import { SQS } from '@aws-sdk/client-sqs';

const MAX_JOBS_PER_MESSAGE = 1000;

export type UnifiedEvent = {
  type: string;
  source: string;
  version: string;
  timestamp: number;
  data: Record<string, unknown>;
};

export type UserItemEvent = UnifiedEvent & {
  data: {
    user_id: number;
    item_id: number;
  };
};

export type UserItemTagsEvent = UnifiedEvent & {
  data: {
    user_id: number;
    item_id: number;
    tags: string[];
  };
};

export type PremiumSubscriptionCreatedEvent = UnifiedEvent & {
  type: 'premium-subscription-created';
  data: {
    user_id: number;
  };
};

export type PipelineError = {
  type: 'error';
  error: any;
};

// These are all message types in the stream
export type PipelineMessage = UnifiedEvent | PipelineError;

// TODO: Find these type in AWS source | types not available as far as I can tell
export type KinesisEvent = {
  Records: KinesisRecord[];
};

export type KinesisRecord = {
  kinesis: KinesisData;
};

export type KinesisData = {
  data: string;
};

// TODO: Catch exception
const getPayloadFromRecord = (record: KinesisRecord): string => {
  return Buffer.from(record.kinesis.data, 'base64').toString('ascii');
};

export const getMessageFromPayload = (payload: string): PipelineMessage => {
  if (payload === '\n') {
    //Something is writing a new line to the Unified Event stream, because. Reasons.
    return {
      type: 'error',
      error: new Error('getMessageFromPayload: newline error'),
    };
  }

  try {
    return JSON.parse(payload);
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error('JSON Error', {
        payload,
      });
      return {
        type: 'error',
        error: e,
      };
    } else {
      throw e;
    }
  }
};

const getMessagesFromRecords = (
  records: KinesisRecord[],
): PipelineMessage[] => {
  return records.map((record: KinesisRecord) => {
    const payload = getPayloadFromRecord(record);
    return getMessageFromPayload(payload);
  });
};

const getUserListImportSqsMessage = (
  msgs: PremiumSubscriptionCreatedEvent[],
): UserListImportSqsMessage => {
  return {
    users: msgs.map((m) => {
      return {
        userId: m.data.user_id,
      };
    }),
  };
};

const getUserItemsUpdateSqsMessage = (
  msgs: (UserItemEvent | UserItemTagsEvent)[],
): UserItemsSqsMessage => {
  console.log('Processing messages', {
    messages: JSON.stringify(msgs),
  });
  return {
    userItems: msgs.map((m) => ({
      userId: m.data.user_id,
      itemIds: [m.data.item_id],
    })),
  };
};

type PipelineOptions = {
  queueUrl: string;
  events: PipelineMessage[];
  msgType: string;
  transformer: (msg: PipelineMessage[]) => SqsMessage;
};

export const getHandler: any = (
  sqsClient: SQS,
  config: {
    userListImportUrl: string;
    userItemsUpdateUrl: string;
    userItemsDeleteUrl: string;
  },
) => {
  const createPipelinePromise = (opts: PipelineOptions): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      _(opts.events)
        .filter((msg: PipelineMessage) => msg.type === opts.msgType)
        .batch(MAX_JOBS_PER_MESSAGE)
        .map(opts.transformer)
        .map(JSON.stringify)
        .pipe(
          new SqsWritable({
            sqsClient,
            queueUrl: opts.queueUrl,
          }),
        )
        .on('finish', () => resolve(true))
        .on('error', (error) =>
          reject(
            `createPipelinePromise ${opts.msgType} failed to process: ${error}`,
          ),
        );
    });
  };

  return async (event: KinesisEvent, context: any): Promise<any[]> => {
    const events: PipelineMessage[] = getMessagesFromRecords(event.Records);

    return await Promise.all([
      createPipelinePromise({
        events,
        queueUrl: config.userListImportUrl,
        msgType: 'premium-subscription-created',
        transformer: getUserListImportSqsMessage,
      }),
      createPipelinePromise({
        events,
        queueUrl: config.userItemsUpdateUrl,
        msgType: 'user-list-item-created',
        transformer: getUserItemsUpdateSqsMessage,
      }),
      createPipelinePromise({
        events,
        queueUrl: config.userItemsUpdateUrl,
        msgType: 'user-item-archived',
        transformer: getUserItemsUpdateSqsMessage,
      }),
      createPipelinePromise({
        events,
        queueUrl: config.userItemsUpdateUrl,
        msgType: 'user-item-unarchived',
        transformer: getUserItemsUpdateSqsMessage,
      }),
      createPipelinePromise({
        events,
        queueUrl: config.userItemsDeleteUrl,
        msgType: 'user-item-deleted',
        transformer: getUserItemsUpdateSqsMessage,
      }),
      createPipelinePromise({
        events,
        queueUrl: config.userItemsUpdateUrl,
        msgType: 'user-item-tags-added',
        transformer: getUserItemsUpdateSqsMessage,
      }),
      createPipelinePromise({
        events,
        queueUrl: config.userItemsUpdateUrl,
        msgType: 'user-item-tags-removed',
        transformer: getUserItemsUpdateSqsMessage,
      }),
      createPipelinePromise({
        events,
        queueUrl: config.userItemsUpdateUrl,
        msgType: 'user-item-tags-replaced',
        transformer: getUserItemsUpdateSqsMessage,
      }),
      createPipelinePromise({
        events,
        queueUrl: config.userItemsUpdateUrl,
        msgType: 'user-item-favorited',
        transformer: getUserItemsUpdateSqsMessage,
      }),
      createPipelinePromise({
        events,
        queueUrl: config.userItemsUpdateUrl,
        msgType: 'user-item-unfavorited',
        transformer: getUserItemsUpdateSqsMessage,
      }),
    ]);
  };
};
