import {
  ApnsClient,
  Errors,
  Notification,
  NotificationOptions,
  Priority,
  PushType,
} from 'apns2';
import { sqs } from './sqs';
import { TARGET_APNS, TARGET_APNS_SILENT } from './notificationTypes';
import * as config from './config';

const prodProvider = new ApnsClient({
  team: config.apns.token.teamId,
  keyId: config.apns.token.keyId,
  signingKey: config.apns.token.key,
});

const devProvider = new ApnsClient({
  team: config.apns.token.teamId,
  keyId: config.apns.token.keyId,
  signingKey: config.apns.token.key,
  host: 'api.sandbox.push.apple.com',
});

type NoteOptions =
  | string
  | {
      title: string;
      subtitle?: string;
      body: string;
    }; // same as NotificationOptions.alert

export const apns = {
  sendNotificationToDevice: async (
    notification: NoteOptions,
    token: string,
    isSilent: boolean,
  ): Promise<void> => {
    isSilent = isSilent || notification === 'Ping';

    const noteOptions: NotificationOptions = {
      expiration: Math.floor(Date.now() / 1000) + 3600, // Expires 1 hour from now.
    };

    if (isSilent) {
      noteOptions.type = PushType.background;
      noteOptions.priority = Priority.throttled;
      noteOptions.contentAvailable = true;
    } else {
      // Regular Push Notification
      noteOptions.alert = notification;
      noteOptions.sound = 'n.caf';
      noteOptions.priority = Priority.immediate;
      noteOptions.type = PushType.alert;
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
      noteOptions.topic = config.apns.prodBundleId;
      console.log('APNS Production topic');
    } else if (tokenGroup.includes('enterprise')) {
      //Per Nik Z. Enterprise is gone and should be invalidated
      console.log('APNS Enterprise topic, destroying this token');
      await sqs.destroyToken(target, token);
      return;
    } else {
      console.log('APNS Alpha topic');
      noteOptions.topic = config.apns.betaBundleId;
    }

    const recipient = apnToken(Buffer.from(tokenString, 'base64'));
    const note = new Notification(recipient, noteOptions);

    try {
      await provider.send(note);
    } catch (err) {
      if (err.reason === Errors.badDeviceToken) {
        //This means that the device is unregistered
        console.warn('Device unregistered pushing token to destroy queue', {
          token,
        });
        await sqs.destroyToken(target, token);
        return;
      }
      console.error(err, token);
      throw err;
    }
  },
};

/**
 * Old function from node-apn, but we need it because our token string is encoded according to how they did it.
 * https://github.com/node-apn/node-apn/blob/b32ad2419120482ed62e7fa565f0612ed9814a7d/lib/token.js#L7
 *
 * Validates a device token
 *
 * Will convert to string and removes invalid characters as required.
 */
const apnToken = (input: Buffer | string): string => {
  let token: string;

  if (typeof input === 'string') {
    token = input;
  } else if (Buffer.isBuffer(input)) {
    token = input.toString('hex');
  }

  token = token.replace(/[^0-9a-f]/gi, '');

  if (token.length === 0) {
    throw new Error('Token has invalid length');
  }

  return token;
};
