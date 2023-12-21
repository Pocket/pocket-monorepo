import { Construct } from 'constructs';
import {
  App,
  DataTerraformRemoteState,
  RemoteBackend,
  TerraformStack,
  Aspects,
  MigrateIds,
} from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { SqsQueuePolicy } from '@cdktf/provider-aws/lib/sqs-queue-policy';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { PagerdutyProvider } from '@cdktf/provider-pagerduty/lib/provider';
import { NullProvider } from '@cdktf/provider-null/lib/provider';
import { LocalProvider } from '@cdktf/provider-local/lib/provider';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { config } from './config';
import { PocketPagerDuty, PocketVPC } from '@pocket-tools/terraform-modules';
import * as fs from 'fs';
import { TransactionalEmailSQSLambda } from './transactionalEmailSQSLambda';

class TransactionalEmails extends TerraformStack {
  constructor(scope: Construct, name: string) {
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
    const pocketVpc = new PocketVPC(this, 'pocket-vpc');

    const sqsLambda = new TransactionalEmailSQSLambda(
      this,
      'events',
      pocketVpc,
      this.createPagerDuty(),
    );

    //dlq for sqs-sns subscription
    const snsTopicDlq = new SqsQueue(this, 'sns-topic-dlq', {
      name: `${config.prefix}-SNS-Topics-DLQ`,
      tags: config.tags,
    });

    const userEventTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.userTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsLambda,
      snsTopicDlq,
      userEventTopicArn,
      config.eventBridge.userTopic,
    );

    const premiumPurchaseTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.premiumPurchaseTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsLambda,
      snsTopicDlq,
      premiumPurchaseTopicArn,
      config.eventBridge.premiumPurchaseTopic,
    );

    const userRegistrationTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.userRegistrationTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsLambda,
      snsTopicDlq,
      userRegistrationTopicArn,
      config.eventBridge.userRegistrationTopic,
    );

    const SNSTopicsSubscriptionList = [
      userEventTopicArn,
      premiumPurchaseTopicArn,
      userRegistrationTopicArn,
    ];
    this.createPoliciesForTransactionalEmailSQSQueue(
      sqsLambda.construct.applicationSqsQueue.sqsQueue,
      snsTopicDlq,
      SNSTopicsSubscriptionList,
    );

    // Pre cdktf 0.17 ids were generated differently so we need to apply a migration aspect
    // https://developer.hashicorp.com/terraform/cdktf/concepts/aspects
    Aspects.of(this).add(new MigrateIds());
  }

  /**
   * Create PagerDuty service for alerts
   * @private
   */
  private createPagerDuty() {
    // don't create any pagerduty resources if in dev
    if (config.isDev) {
      return undefined;
    }

    const incidentManagement = new DataTerraformRemoteState(
      this,
      'incident_management',
      {
        organization: 'Pocket',
        workspaces: {
          name: 'incident-management',
        },
      },
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
   * Create SQS subscription for the SNS.
   * @param sqsLambda SQS integrated with the snowplow-consumer-lambda
   * @param snsTopicArn topic the SQS wants to subscribe to.
   * @param snsTopicDlq the DLQ to which the messages will be forwarded if SQS is down
   * @param topicName topic we want to subscribe to.
   * @private
   */
  private subscribeSqsToSnsTopic(
    sqsLambda: TransactionalEmailSQSLambda,
    snsTopicDlq: SqsQueue,
    snsTopicArn: string,
    topicName: string,
  ) {
    // This Topic already exists and is managed elsewhere
    return new SnsTopicSubscription(this, `${topicName}-sns-subscription`, {
      topicArn: snsTopicArn,
      protocol: 'sqs',
      endpoint: sqsLambda.construct.applicationSqsQueue.sqsQueue.arn,
      redrivePolicy: JSON.stringify({
        deadLetterTargetArn: snsTopicDlq.arn,
      }),
    });
  }

  /**
   *
   * @param snsTopicQueue SQS that triggers the lambda
   * @param snsTopicDlq DLQ to which the messages will be forwarded if SQS is down
   * @param snsTopicArns list of SNS topic to which we want to subscribe to
   * @private
   */
  private createPoliciesForTransactionalEmailSQSQueue(
    snsTopicQueue: SqsQueue,
    snsTopicDlq: SqsQueue,
    snsTopicArns: string[],
  ): void {
    [
      { name: 'transactional-email-sns-sqs', resource: snsTopicQueue },
      { name: 'transactional-email-sns-dlq', resource: snsTopicDlq },
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
                  //add any sns topic to this list that we want this SQS to listen to
                  values: snsTopicArns,
                },
              ],
            },
            //add any other subscription policy for this SQS
          ],
        },
      ).json;

      new SqsQueuePolicy(this, `${queue.name}-policy`, {
        queueUrl: queue.resource.url,
        policy: policy,
      });
    });
  }
}

const app = new App();
const stack = new TransactionalEmails(app, 'transactional-emails');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
