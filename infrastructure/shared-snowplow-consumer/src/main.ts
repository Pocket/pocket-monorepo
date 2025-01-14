import { config } from './config/index.ts';
import {
  SharedSnowplowConsumerApp,
  SharedSnowplowConsumerProps,
} from './sharedSnowplowConsumerApp.ts';
import { provider as archiveProvider } from '@cdktf/provider-archive';
import {
  provider as awsProvider,
  cloudwatchMetricAlarm,
  dataAwsCallerIdentity,
  dataAwsIamPolicyDocument,
  dataAwsKmsAlias,
  dataAwsRegion,
  dataAwsSnsTopic,
  snsTopicSubscription,
  sqsQueue,
  sqsQueuePolicy,
} from '@cdktf/provider-aws';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';

class SnowplowSharedConsumerStack extends TerraformStack {
  constructor(
    scope: Construct,
    private name: string,
  ) {
    super(scope, name);

    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
    });
    new localProvider.LocalProvider(this, 'local_provider');
    new nullProvider.NullProvider(this, 'null_provider');
    new archiveProvider.ArchiveProvider(this, 'archive_provider');

    new S3Backend(this, {
      bucket: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      dynamodbTable: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      key: config.name,
      region: 'us-east-1',
    });

    const region = new dataAwsRegion.DataAwsRegion(this, 'region');
    const caller = new dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'caller',
    );
    const alarmSnsTopic = this.getCodeDeploySnsTopic();

    const sqsDLQConsumeQueue = new sqsQueue.SqsQueue(
      this,
      'shared-event-consumer-dlq',
      {
        name: `${config.prefix}-SharedEventConsumer-Queue-DLQ`,
        tags: config.tags,
      },
    );

    // DLQ Alarm.
    this.createDeadLetterQueueAlarm(
      alarmSnsTopic,
      sqsDLQConsumeQueue.name,
      `${config.prefix}-ConsumeQueue-Dlq-Alarm`,
    );

    // Consume Queue - receives all events from event-bridge
    const sqsConsumeQueue = new sqsQueue.SqsQueue(
      this,
      'shared-event-consumer',
      {
        name: `${config.prefix}-SharedEventConsumer-Queue`,
        tags: config.tags,
        redrivePolicy: JSON.stringify({
          deadLetterTargetArn: sqsDLQConsumeQueue.arn,
          maxReceiveCount: 3,
        }),
      },
    );

    // Dead Letter Queue (dlq) for sqs-sns subscription.
    // Also re-used for any Snowplow emission failure
    const snsTopicDlq = new sqsQueue.SqsQueue(this, 'sns-topic-dlq', {
      name: `${config.prefix}-SNS-Topics-DLQ`,
      tags: config.tags,
    });

    // DLQ Alarm.
    this.createDeadLetterQueueAlarm(
      alarmSnsTopic,
      snsTopicDlq.name,
      `${config.prefix}-Topics-Dlq-Alarm`,
    );

    // Consumer Queue should be able to listen to user events.
    const userEventTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.userTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsConsumeQueue,
      snsTopicDlq,
      userEventTopicArn,
      config.eventBridge.userTopic,
    );

    // Consumer Queue should be able to listen to dismiss-prospect events from prospect-api.
    const prospectEventTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.prospectEventTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsConsumeQueue,
      snsTopicDlq,
      prospectEventTopicArn,
      config.eventBridge.prospectEventTopic,
    );

    // Consumer Queue should be able to listen to shareable-list (create, update, delete, hide) events from shareable-lists-api.
    const shareableListEventTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.shareableListEventTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsConsumeQueue,
      snsTopicDlq,
      shareableListEventTopicArn,
      config.eventBridge.shareableListEventTopic,
    );

    // Consumer Queue should be able to listen to shareable-list-item (create, delete) from shareable-lists-api.
    const shareableListItemEventTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.shareableListItemEventTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsConsumeQueue,
      snsTopicDlq,
      shareableListItemEventTopicArn,
      config.eventBridge.shareableListItemEventTopic,
    );

    // Consumer Queue should be able to listen to pocket_share (create, update) from shares-api.
    const sharesApiEventTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.sharesApiEventTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsConsumeQueue,
      snsTopicDlq,
      sharesApiEventTopicArn,
      config.eventBridge.sharesApiEventTopic,
    );

    // Consumer Queue should be able to listen to search result events from search-api
    const searchApiEventTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.searchApiEventTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsConsumeQueue,
      snsTopicDlq,
      searchApiEventTopicArn,
      config.eventBridge.searchApiEventTopic,
    );

    // Consumer Queue should be able to listen to collection-created and collection-updated events from collection-api.
    const collectionEventTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.collectionEventTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsConsumeQueue,
      snsTopicDlq,
      collectionEventTopicArn,
      config.eventBridge.collectionEventTopic,
    );

    // Add additional event subscriptions here.
    const SNSTopicsSubscriptionList = [
      userEventTopicArn,
      prospectEventTopicArn,
      shareableListEventTopicArn,
      shareableListItemEventTopicArn,
      collectionEventTopicArn,
      sharesApiEventTopicArn,
      searchApiEventTopicArn,
    ];

    // Assigns inline access policy for SQS and DLQ.
    // Include SNS topics that we want the queue to subscribe to within this policy.
    this.createPoliciesForAccountDeletionMonitoringSqs(
      sqsConsumeQueue,
      snsTopicDlq,
      SNSTopicsSubscriptionList,
    );

    // ECS app creation.
    const appProps: SharedSnowplowConsumerProps = {
      caller: caller,
      region: region,
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: alarmSnsTopic,
      sqsConsumeQueue: sqsConsumeQueue,
      sqsDLQ: snsTopicDlq,
    };

    new SharedSnowplowConsumerApp(
      this,
      'shared-snowplow-consumer-app',
      appProps,
    );
  }

  /**
   * Get the sns topic for code deploy
   * @private
   */
  private getCodeDeploySnsTopic() {
    return new dataAwsSnsTopic.DataAwsSnsTopic(this, 'backend_notifications', {
      name: `Backend-${config.environment}-ChatBot`,
    });
  }

  /**
   * Get secrets manager kms alias
   * @private
   */
  private getSecretsManagerKmsAlias() {
    return new dataAwsKmsAlias.DataAwsKmsAlias(this, 'kms_alias', {
      name: 'alias/aws/secretsmanager',
    });
  }

  /**
   * Create SQS subscription for the SNS.
   * @param sqsConsumeQueue SQS integrated the SQS consume queue
   * @param snsTopicArn topic the SQS wants to subscribe to.
   * @param snsTopicDlq the DLQ to which the messages will be forwarded if SQS is down
   * @param topicName topic we want to subscribe to.
   * @private
   */
  private subscribeSqsToSnsTopic(
    sqsConsumeQueue: sqsQueue.SqsQueue,
    snsTopicDlq: sqsQueue.SqsQueue,
    snsTopicArn: string,
    topicName: string,
  ) {
    // This Topic already exists and is managed elsewhere
    return new snsTopicSubscription.SnsTopicSubscription(
      this,
      `${topicName}-sns-subscription`,
      {
        topicArn: snsTopicArn,
        protocol: 'sqs',
        endpoint: sqsConsumeQueue.arn,
        redrivePolicy: JSON.stringify({
          deadLetterTargetArn: snsTopicDlq.arn,
        }),
      },
    );
  }

  /**
   * Create inline IAM policy for the SQS and DLQ tied to the lambda
   * Note: we need to append any additional IAM policy to this.
   * Re-running this with a different iam would replace the inline access policy.
   *
   * @param snsTopicQueue SQS that triggers the lambda
   * @param snsTopicDlq DLQ to which the messages will be forwarded if SQS is down
   * @param snsTopicArns list of SNS topic to which we want to subscribe to
   * @private
   */
  private createPoliciesForAccountDeletionMonitoringSqs(
    snsTopicQueue: sqsQueue.SqsQueue,
    snsTopicDlq: sqsQueue.SqsQueue,
    snsTopicArns: string[],
  ): void {
    [
      { name: 'shared-snowplow-consumer-sns-sqs', resource: snsTopicQueue },
      { name: 'shared-snowplow-consumer-sns-dlq', resource: snsTopicDlq },
    ].forEach((queue) => {
      const policy = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        `${queue.name}-policy-document`,
        {
          statement: [
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
                  // add any SNS topics to this list that we want SQSes (dlq, consume) to be able to access
                  values: snsTopicArns,
                },
              ],
            },
            // add any other subscription policy for this SQS
          ],
        },
      ).json;

      new sqsQueuePolicy.SqsQueuePolicy(this, `${queue.name}-policy`, {
        queueUrl: queue.resource.url,
        policy: policy,
      });
    });
  }

  /**
   * Function to create alarms for Dead-letter queues.
   * Create a non-critical alarm in prod environment for
   * SQS queue based on the number of messages visible.
   * Default is 15 alerts on 2 evaluation period of 15 minutes.
   * @param alarmSnsTopic
   * @param queueName dead-letter queue name
   * @param alarmName alarm name (please pass event-rule name for a clear description)
   * @param evaluationPeriods
   * @param periodInSeconds
   * @param threshold
   * @private
   */
  private createDeadLetterQueueAlarm(
    alarmSnsTopic: dataAwsSnsTopic.DataAwsSnsTopic,
    queueName: string,
    alarmName: string,
    evaluationPeriods = 2,
    periodInSeconds = 900,
    threshold = 15,
  ) {
    new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      alarmName.toLowerCase(),
      {
        alarmActions: config.isDev ? [] : [alarmSnsTopic.arn],
        alarmDescription: `Number of messages >= ${threshold}`,
        alarmName: `${config.prefix}-${alarmName}`,
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        dimensions: { QueueName: queueName },
        evaluationPeriods: evaluationPeriods,
        metricName: 'ApproximateNumberOfMessagesVisible',
        namespace: 'AWS/SQS',
        okActions: config.isDev ? [] : [alarmSnsTopic.arn],
        period: periodInSeconds,
        statistic: 'Sum',
        // At some point on 10/11/2024, AWS changed the behavior for our dlq alarms and they flop from having 0 messages to missing data.
        treatMissingData: 'notBreaching',
        threshold: threshold,
      },
    );
  }
}

const app = new App();
new SnowplowSharedConsumerStack(app, config.domainPrefix);
app.synth();
