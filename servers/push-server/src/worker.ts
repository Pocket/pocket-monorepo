import { Message } from 'aws-sdk/clients/sqs'
import {TARGET_APNS, TARGET_APNS_SILENT, TARGET_GCM} from './notificationTypes'
import { apns } from './apns'
import { sendNotificationToDevice } from './gcm'
import Sentry from './sentry'
import {sqs} from './sqs';

const processMessage = async (fullMessage: Message): Promise<void> => {
  let message = JSON.parse(fullMessage.Body || '')

  let contents = message.message
  let token = message.recipient
  let target = parseInt(message.target, 10)

  Sentry.addBreadcrumb({
    category: 'job',
    message: `Processing message`,
    data: {message, target, token},
    level: 'info'
  })

  if (target === TARGET_APNS) {
    console.log('APNS push', token)
    await apns.sendNotificationToDevice(contents, {
      s: message.share_id,
      i: message.item_id,
      url: message.url,
      notification_id: message.notification_id,
    }, token, false)
  } else if (target === TARGET_APNS_SILENT) {
    console.log('APNS SILENT push', token)
    await apns.sendNotificationToDevice(contents, {
      g: message.guid,
    }, token, true)
  } else if (target === TARGET_GCM) {
    console.log('GCM push', token)
    try {
      await sendNotificationToDevice(contents, {
        share_id: message.share_id,
        item_id: message.item_id,
      }, token)
    } catch (err) {
      if (err === 'NotRegistered') {
        await sqs.destroyToken(TARGET_GCM, token)
      }
    }
  } else {
    console.warn(`Unhandled target ${target}`, {message})
    Sentry.captureMessage(`Unhandled target ${target}`)
  }
}

const doBatch = async (): Promise<boolean[]> => {
  const messages = await sqs.getMessages()
  return await Promise.all(messages.map(async (message:Message) : Promise<boolean> => {
    try {
      await processMessage(message)
      await sqs.deleteMessage(message)
      return true
    } catch (e) {
      console.error('Error handling message', {e, message})
      return false
    }
  }))
}

export const worker = {
  work: async (count = 1000) => {
    for (let i = 0; i < count; i++) {
      await doBatch()
      console.log('Completed iteration', {i})
    }
    Sentry.flush();
    console.log('Completed all iterations')
  },
}
