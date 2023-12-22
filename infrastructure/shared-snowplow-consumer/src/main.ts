import { config } from './config';
import {
  SharedSnowplowConsumerApp,
  SharedSnowplowConsumerProps,
} from './sharedSnowplowConsumerApp';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { LocalProvider } from '@cdktf/provider-local/lib/provider';
import { NullProvider } from '@cdktf/provider-null/lib/provider';
import { PagerdutyProvider } from '@cdktf/provider-pagerduty/lib/provider';

import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { DataAwsKmsAlias } from '@cdktf/provider-aws/lib/data-aws-kms-alias';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DataAwsSnsTopic } from '@cdktf/provider-aws/lib/data-aws-sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { SqsQueuePolicy } from '@cdktf/provider-aws/lib/sqs-queue-policy';

import { PocketPagerDuty } from '@pocket-tools/terraform-modules';
import { Construct } from 'constructs';
import {
  App,
  DataTerraformRemoteState,
  RemoteBackend,
  TerraformStack,
} from 'cdktf';

class SnowplowSharedConsumerStack extends TerraformStack {
  constructor(scope: Construct, private name: string) {
    super(scope, name);

    new AwsProvider(this, 'aws', { region: 'us-east-1' });
    new PagerdutyProvider(this, 'pagerduty_provider', { token: undefined });
    new LocalProvider(this, 'local_provider');
    new NullProvider(this, 'null_provider');
    new ArchiveProvider(this, 'archive_provider');

    new RemoteBackend(this, {
      hostname: 'app.terraform.io',
      organization: 'Pocket',
      workspaces: [{ prefix: `${config.name}-` }],
    });

    const region = new DataAwsRegion(this, 'region');
    const caller = new DataAwsCallerIdentity(this, 'caller');
    const pagerDuty = this.createPagerDuty();

    // Consume Queue - receives all events from event-bridge
    const sqsConsumeQueue = new SqsQueue(this, 'shared-event-consumer', {
      name: `${config.prefix}-SharedEventConsumer-Queue`,
      tags: config.tags,
    });

    // Dead Letter Queue (dlq) for sqs-sns subscription.
    // Also re-used for any Snowplow emission failure
    const snsTopicDlq = new SqsQueue(this, 'sns-topic-dlq', {
      name: `${config.prefix}-SNS-Topics-DLQ`,
      tags: config.tags,
    });

    // DLQ Alarm.
    this.createDeadLetterQueueAlarm(
      pagerDuty,
      snsTopicDlq.name,
      `${config.prefix}-Dlq-Alarm`
    );

    // Consumer Queue should be able to listen to user events.
    const userEventTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.userTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsConsumeQueue,
      snsTopicDlq,
      userEventTopicArn,
      config.eventBridge.userTopic
    );

    // Consumer Queue should be able to listen to dismiss-prospect events from prospect-api.
    const prospectEventTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.prospectEventTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsConsumeQueue,
      snsTopicDlq,
      prospectEventTopicArn,
      config.eventBridge.prospectEventTopic
    );

    // Consumer Queue should be able to listen to shareable-list (create, update, delete, hide) events from shareable-lists-api.
    const shareableListEventTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.shareableListEventTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsConsumeQueue,
      snsTopicDlq,
      shareableListEventTopicArn,
      config.eventBridge.shareableListEventTopic
    );

    // Consumer Queue should be able to listen to shareable-list-item (create, delete) from shareable-lists-api.
    const shareableListItemEventTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.shareableListItemEventTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsConsumeQueue,
      snsTopicDlq,
      shareableListItemEventTopicArn,
      config.eventBridge.shareableListItemEventTopic
    );

    // Consumer Queue should be able to listen to collection-created and collection-updated events from collection-api.
    const collectionEventTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.collectionEventTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsConsumeQueue,
      snsTopicDlq,
      collectionEventTopicArn,
      config.eventBridge.collectionEventTopic
    );

    // Add additional event subscriptions here.
    const SNSTopicsSubscriptionList = [
      userEventTopicArn,
      prospectEventTopicArn,
      shareableListEventTopicArn,
      shareableListItemEventTopicArn,
      collectionEventTopicArn,
    ];

    // Assigns inline access policy for SQS and DLQ.
    // Include SNS topics that we want the queue to subscribe to within this policy.
    this.createPoliciesForAccountDeletionMonitoringSqs(
      sqsConsumeQueue,
      snsTopicDlq,
      SNSTopicsSubscriptionList
    );

    // ECS app creation.
    const appProps: SharedSnowplowConsumerProps = {
      caller: caller,
      pagerDuty: pagerDuty,
      region: region,
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      sqsConsumeQueue: sqsConsumeQueue,
      sqsDLQ: snsTopicDlq,
    };

    new SharedSnowplowConsumerApp(
      this,
      'shared-snowplow-consumer-app',
      appProps
    );
  }

  /**
   * Get the sns topic for code deploy
   * @private
   */
  private getCodeDeploySnsTopic() {
    return new DataAwsSnsTopic(this, 'backend_notifications', {
      name: `Backend-${config.environment}-ChatBot`,
    });
  }

  /**
   * Get secrets manager kms alias
   * @private
   */
  private getSecretsManagerKmsAlias() {
    return new DataAwsKmsAlias(this, 'kms_alias', {
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
    sqsConsumeQueue: SqsQueue,
    snsTopicDlq: SqsQueue,
    snsTopicArn: string,
    topicName: string
  ) {
    // This Topic already exists and is managed elsewhere
    return new SnsTopicSubscription(this, `${topicName}-sns-subscription`, {
      topicArn: snsTopicArn,
      protocol: 'sqs',
      endpoint: sqsConsumeQueue.arn,
      redrivePolicy: JSON.stringify({
        deadLetterTargetArn: snsTopicDlq.arn,
      }),
    });
  }

  /**
   * Create PagerDuty service for alerts
   * @private
   */
  private createPagerDuty() {
    const incidentManagement = new DataTerraformRemoteState(
      this,
      'incident_management',
      {
        organization: 'Pocket',
        workspaces: {
          name: 'incident-management',
        },
      }
    );

    return new PocketPagerDuty(this, 'pagerduty', {
      prefix: config.prefix,
      service: {
        // This is a Tier 2 service and as such only raises non-critical alarms.
        criticalEscalationPolicyId: incidentManagement
          .get('policy_default_non_critical_id')
          .toString(),
        nonCriticalEscalationPolicyId: incidentManagement
          .get('policy_default_non_critical_id')
          .toString(),
      },
    });
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
    snsTopicQueue: SqsQueue,
    snsTopicDlq: SqsQueue,
    snsTopicArns: string[]
  ): void {
    [
      { name: 'shared-snowplow-consumer-sns-sqs', resource: snsTopicQueue },
      { name: 'shared-snowplow-consumer-sns-dlq', resource: snsTopicDlq },
    ].forEach((queue) => {
      const policy = new DataAwsIamPolicyDocument(
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
        }
      ).json;

      new SqsQueuePolicy(this, `${queue.name}-policy`, {
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
   * @param pagerDuty
   * @param queueName dead-letter queue name
   * @param alarmName alarm name (please pass event-rule name for a clear description)
   * @param evaluationPeriods
   * @param periodInSeconds
   * @param threshold
   * @private
   */
  private createDeadLetterQueueAlarm(
    pagerDuty: PocketPagerDuty,
    queueName: string,
    alarmName: string,
    evaluationPeriods = 2,
    periodInSeconds = 900,
    threshold = 15
  ) {
    new CloudwatchMetricAlarm(this, alarmName.toLowerCase(), {
      alarmActions: config.isDev
        ? []
        : [pagerDuty.snsNonCriticalAlarmTopic.arn],
      alarmDescription: `Number of messages >= ${threshold}`,
      alarmName: `${config.prefix}-${alarmName}`,
      comparisonOperator: 'GreaterThanOrEqualToThreshold',
      dimensions: { QueueName: queueName },
      evaluationPeriods: evaluationPeriods,
      metricName: 'ApproximateNumberOfMessagesVisible',
      namespace: 'AWS/SQS',
      okActions: config.isDev ? [] : [pagerDuty.snsNonCriticalAlarmTopic.arn],
      period: periodInSeconds,
      statistic: 'Sum',
      threshold: threshold,
    });
  }
}

const app = new App();
new SnowplowSharedConsumerStack(app, config.domainPrefix);
app.synth();
