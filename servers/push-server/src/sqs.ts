import AWS from 'aws-sdk'
import { Message, SendMessageResult } from 'aws-sdk/clients/sqs'

const config = {
  jobQueueUrl: process.env.JOB_QUEUE_URL || '',
  tokenQueueUrl: process.env.TOKEN_QUEUE_URL || '',
  region: process.env.AWS_REGION || '',
  sqsEndpoint: process.env.SQS_ENDPOINT || '',
}

// Create an SQS service object
const client = new AWS.SQS({
  apiVersion: '2012-11-05',
  endpoint: config.sqsEndpoint,
  region: config.region,
})

export const sqs = {
  getMessages: async (): Promise<Message[]> => {
    const {Messages} = await client.receiveMessage({
      QueueUrl: config.jobQueueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    }).promise()

    return (Messages || [])
  },
  deleteMessage: (message: Message): Promise<any> => {
    return client.deleteMessage({
      QueueUrl: config.jobQueueUrl,
      ReceiptHandle: message.ReceiptHandle || '',
    }).promise()
  },
  destroyToken: (tokenType: number, token: string): Promise<SendMessageResult> => {
    console.log('Invalidating device token', token)
    return client.sendMessage({
      QueueUrl: config.tokenQueueUrl,
      MessageBody: JSON.stringify({
        action: 'invalidate',
        notificationType: tokenType,
        token: token,
      }),
    }).promise()
  },
}
