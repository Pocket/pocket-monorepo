import {
  TARGET_APNS,
  TARGET_APNS_SILENT,
  TARGET_GCM,
} from './notificationTypes';
import { apns } from './apns';
import { sendNotificationToDevice } from './gcm';
import Sentry from './sentry';
import { sqs } from './sqs';
import { Message } from '@aws-sdk/client-sqs';
import { serverLogger } from '@pocket-tools/ts-logger';

const processMessage = async (fullMessage: Message): Promise<void> => {
  const message = JSON.parse(fullMessage.Body || '');

  const contents = message.message;
  const token = message.recipient;
  const target = parseInt(message.target, 10);

  Sentry.addBreadcrumb({
    category: 'job',
    message: `Processing message`,
    data: { message, target, token },
    level: 'info',
  });

  if (
    target === TARGET_APNS_SILENT ||
    (target === TARGET_APNS && contents === 'Ping')
  ) {
    serverLogger.info('APNS SILENT push', token);
    await apns.sendNotificationToDevice(contents, token, true);
  } else if (target === TARGET_GCM) {
    serverLogger.info('GCM push', token);
    try {
      await sendNotificationToDevice(contents, token);
    } catch (err) {
      if (err === 'NotRegistered') {
        await sqs.destroyToken(TARGET_GCM, token);
      }
    }
  } else {
    serverLogger.warn(`Unhandled target ${target}`, { message });
  }
};

const doBatch = async (): Promise<boolean[]> => {
  const messages = await sqs.getMessages();
  return await Promise.all(
    messages.map(async (message: Message): Promise<boolean> => {
      try {
        await processMessage(message);
        await sqs.deleteMessage(message);
        return true;
      } catch (e) {
        console.error('Error handling message', { e, message });
        return false;
      }
    }),
  );
};

export const worker = {
  work: async (count = 1000) => {
    for (let i = 0; i < count; i++) {
      await doBatch();
      serverLogger.info('Completed iteration', { i });
    }
    Sentry.flush();
    serverLogger.info('Completed all iterations');
  },
};
