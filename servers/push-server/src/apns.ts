import {
  NotificationAlertOptions,
  ProviderToken,
  ResponseFailure,
  Responses,
  Provider,
  Notification,
  token as apnToken,
} from 'apn';
import { sqs } from './sqs';
import { TARGET_APNS, TARGET_APNS_SILENT } from './notificationTypes';
import * as config from './config';

const configToken: ProviderToken = config.apns.token;

const prodProvider = new Provider({
  production: true,
  token: configToken,
});

const devProvider = new Provider({
  production: false,
  token: configToken,
});

export const apns = {
  sendNotificationToDevice: async (
    notification: string | NotificationAlertOptions,
    payload: any,
    token: string,
    isSilent: boolean,
  ): Promise<void> => {
    isSilent = isSilent || notification === 'Ping';

    const note = new Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.

    note.payload = payload;

    if (isSilent) {
      note.pushType = 'background';
      note.priority = 5;
      note.contentAvailable = true;
    } else {
      // Regular Push Notification
      note.alert = notification;
      note.sound = 'n.caf';
      note.priority = 10;
      note.pushType = 'alert';
    }

    const [tokenGroup, tokenString] = token.split('::');
    const target = isSilent ? TARGET_APNS_SILENT : TARGET_APNS;
    const isDev = tokenGroup.includes('dev');
    const provider = isDev ? devProvider : prodProvider;

    if (!tokenString) {
      console.warn('No token string adding to destroy token queue', { token });
      await sqs.destroyToken(target, token);
    }

    if (tokenGroup.includes('prod')) {
      note.topic = config.apns.prodBundleId;
      console.log('APNS Production topic');
    } else if (tokenGroup.includes('enterprise')) {
      //Per Nik Z. Enterprise is gone and should be invalidated
      console.log('APNS Enterprise topic, destroying this token');
      await sqs.destroyToken(target, token);
      return;
    } else {
      console.log('APNS Alpha topic');
      note.topic = config.apns.betaBundleId;
    }

    const recipient = apnToken(Buffer.from(tokenString, 'base64'));
    const responses: Responses = await provider.send(note, recipient);

    await Promise.all(
      responses.failed.map(async (failure: ResponseFailure) => {
        if (failure.status === '410') {
          //This means that the device is unregistered
          console.warn('Device unregistered pushing token to destroy queue', {
            token,
          });
          await sqs.destroyToken(target, token);
          return;
        }
        console.error('APN failure', { failure });
        if (failure.error) {
          throw failure.error;
        }
      }),
    );
  },
};
