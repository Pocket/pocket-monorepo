import { initializeApp } from 'firebase-admin/app';
import { Message, getMessaging } from 'firebase-admin/messaging';
import admin from 'firebase-admin';
import { serviceAccount } from './config';

const app = initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const messaging = getMessaging(app);

export const sendNotificationToDevice = (
  notification: any,
  token: any,
): Promise<string> => {
  const message: Message = {
    token: token,
  };
  return messaging.send(message);
};
