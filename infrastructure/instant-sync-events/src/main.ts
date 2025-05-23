import { config } from './config/index.ts';
import { SQSEventLambda } from './sqsEventLambda.ts';

import { provider as archiveProvider } from '@cdktf/provider-archive';
import {
  provider as awsProvider,
  dataAwsCallerIdentity,
  dataAwsIamPolicyDocument,
  dataAwsRegion,
  snsTopicSubscription,
  sqsQueue,
  sqsQueuePolicy,
  dataAwsSqsQueue,
} from '@cdktf/provider-aws';

import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import { PocketVPC } from '@pocket-tools/terraform-modules';
import { App, S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

class InstantSyncEvents extends TerraformStack {
  constructor(
    scope: Construct,
    private name: string,
  ) {
    super(scope, name);

    new archiveProvider.ArchiveProvider(this, 'archive_provider');
    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
    });
    new localProvider.LocalProvider(this, 'local_provider');
    new nullProvider.NullProvider(this, 'null_provider');

    new S3Backend(this, {
      bucket: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      dynamodbTable: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      key: config.name,
      region: 'us-east-1',
    });

    const caller = new dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'caller',
    );
    const pocketVPC = new PocketVPC(this, 'pocket-vpc');
    const region = new dataAwsRegion.DataAwsRegion(this, 'region');

    // Create Lambda to process events
    const sqsEventLambda = new SQSEventLambda(this, 'EventTracker', {
      vpc: pocketVPC,
      pushQueue: new dataAwsSqsQueue.DataAwsSqsQueue(this, 'job-queue', {
        name: config.pushQueueName,
      }),
    });

    //dlq for sqs-sns subscription
    const snsTopicDlq = new sqsQueue.SqsQueue(this, 'sns-topic-dql', {
      name: `${config.prefix}-SNS-Topics-DLQ`,
      tags: config.tags,
    });

    //subscribe to list-api-events sns topic
    const listApiEventsTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.listEventTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsEventLambda,
      snsTopicDlq,
      listApiEventsTopicArn,
      config.eventBridge.listEventTopic,
    );

    //assign inline access policy for all the sns topics to publish to this ADM queue and dlq
    //Note: any other permission for ADM sqs/dlq should be added here
    this.createPoliciesForInstantSyncEventsSqs(
      sqsEventLambda.construct.applicationSqsQueue.sqsQueue,
      snsTopicDlq,
      listApiEventsTopicArn,
    );
  }

  /**
   * create sns-sqs subscription
   * @param sqsLambda
   * @param snsTopicDlq
   * @param snsTopicArn
   * @param topicName
   * @private
   */
  private subscribeSqsToSnsTopic(
    sqsLambda: SQSEventLambda,
    snsTopicDlq: sqsQueue.SqsQueue,
    snsTopicArn: string,
    topicName: string,
  ) {
    return new snsTopicSubscription.SnsTopicSubscription(
      this,
      `${topicName}-sns-subscription`,
      {
        topicArn: snsTopicArn,
        protocol: 'sqs',
        endpoint: sqsLambda.construct.applicationSqsQueue.sqsQueue.arn,
        redrivePolicy: JSON.stringify({
          deadLetterTargetArn: snsTopicDlq.arn,
        }),
      },
    );
  }

  /**
   * Create IAM policies to allow SNS to write to target SQS queue & a DLQ.
   * Note: we set permissions for multiple sns and event subscriptions.
   * @private
   */
  private createPoliciesForInstantSyncEventsSqs(
    snsTopicQueue: sqsQueue.SqsQueue,
    snsTopicDlq: sqsQueue.SqsQueue,
    listApiEventsTopicArn: string,
  ): void {
    [
      { name: 'adm-sns-sqs', resource: snsTopicQueue },
      { name: 'adm-sns-dlq', resource: snsTopicDlq },
    ].forEach((queue) => {
      console.log(queue.resource.policy);
      const policy = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        `${queue.name}-policy-document`,
        {
          statement: [
            //policy for user-events and user-merge sns
            {
              effect: 'Allow',
              actions: ['sqs:SendMessage'],
              resources: [queue.resource.arn],
              principals: [
                {
                  identifiers: ['sns.amazonaws.com'],
                  type: 'Service',
                },
              ],
              condition: [
                {
                  test: 'ArnLike',
                  variable: 'aws:SourceArn',
                  values: [listApiEventsTopicArn],
                },
              ],
            },
            //todo: add any other policy here e.g scheduled cloudwatch event
          ],
        },
      ).json;

      new sqsQueuePolicy.SqsQueuePolicy(this, `${queue.name}-policy`, {
        queueUrl: queue.resource.url,
        policy: policy,
      });
    });
  }
}

const app = new App();
new InstantSyncEvents(app, 'instant-sync-events');
app.synth();
