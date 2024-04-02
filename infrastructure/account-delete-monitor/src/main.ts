import { config } from './config';
import { DynamoDB } from './dynamodb';
import { SQSEventLambda } from './sqsEventLambda';

import { provider as archiveProvider } from '@cdktf/provider-archive';
import {
  provider as awsProvider,
  dataAwsCallerIdentity,
  dataAwsIamPolicyDocument,
  dataAwsRegion,
  dynamodbTable,
  iamRole,
  iamPolicy,
  iamRolePolicyAttachment,
  snsTopicSubscription,
  sqsQueue,
  sqsQueuePolicy,
} from '@cdktf/provider-aws';

import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import { provider as pagerdutyProvider } from '@cdktf/provider-pagerduty';
import { PocketPagerDuty, PocketVPC } from '@pocket-tools/terraform-modules';
import {
  App,
  DataTerraformRemoteState,
  S3Backend,
  TerraformStack,
} from 'cdktf';
import { Construct } from 'constructs';

class AccountDeleteMonitor extends TerraformStack {
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
    new pagerdutyProvider.PagerdutyProvider(this, 'pagerduty_provider', {
      token: undefined,
    });

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

    const pagerDuty = this.createPagerDuty();
    // Create data store
    const dynamo = new DynamoDB(this, 'event-table');

    // Create Lambda to process events and store/analyze records in DB
    const sqsEventLambda = new SQSEventLambda(this, 'EventTracker', {
      vpc: pocketVPC,
      pagerDuty,
      dynamoTable: dynamo.deleteEventTable,
    });

    // Dynamo Access
    this.addDynamoPermissions(
      'EventTracker',
      sqsEventLambda.construct.lambda.lambdaExecutionRole,
      dynamo.deleteEventTable.dynamodb,
      ['dynamodb:*'],
    );

    //dlq for sqs-sns subscription
    const snsTopicDlq = new sqsQueue.SqsQueue(this, 'sns-topic-dql', {
      name: `${config.prefix}-SNS-Topics-DLQ`,
      tags: config.tags,
    });

    //subscribe to user-merge sns topic
    const userMergeTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.userMergeTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsEventLambda,
      snsTopicDlq,
      userMergeTopicArn,
      config.eventBridge.userMergeTopic,
    );

    //subscribe to user-events sns topic
    const userEventTopicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${config.eventBridge.userTopic}`;
    this.subscribeSqsToSnsTopic(
      sqsEventLambda,
      snsTopicDlq,
      userEventTopicArn,
      config.eventBridge.userTopic,
    );

    //assign inline access policy for all the sns topics to publish to this ADM queue and dlq
    //Note: any other permission for ADM sqs/dlq should be added here
    this.createPoliciesForAccountDeletionMonitoringSqs(
      sqsEventLambda.construct.applicationSqsQueue.sqsQueue,
      snsTopicDlq,
      userEventTopicArn,
      userMergeTopicArn,
    );
  }

  /**
   * Lambda should have full access to manage dynamodb table
   * @param lambdaExecutionRole
   * @param dynamoTable
   */
  private addDynamoPermissions(
    name: string,
    lambdaExecutionRole: iamRole.IamRole,
    dynamoTable: dynamodbTable.DynamodbTable,
    actions: string[],
  ) {
    const policy = new iamPolicy.IamPolicy(
      this,
      `${name}-lambda-dynamo-policy`,
      {
        name: `${this.name}-${name}-DynamoLambdaPolicy`,
        policy: new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
          this,
          `${name}-lambda-dynamo-policy-doc`,
          {
            statement: [
              {
                effect: 'Allow',
                actions,
                resources: [dynamoTable.arn],
              },
            ],
          },
        ).json,
        dependsOn: [lambdaExecutionRole],
      },
    );
    return new iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      `${name}-execution-role-policy-attachment`,
      {
        role: lambdaExecutionRole.name,
        policyArn: policy.arn,
        dependsOn: [lambdaExecutionRole, policy],
      },
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
   * Create IAM policies to allow SNS to write to target SQS queue & a DLQ.
   * Note: we set permissions for multiple sns and event subscriptions.
   * @private
   */
  private createPoliciesForAccountDeletionMonitoringSqs(
    snsTopicQueue: sqsQueue.SqsQueue,
    snsTopicDlq: sqsQueue.SqsQueue,
    userEventTopicArn: string,
    userMergeEventTopicArn: string,
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
                  values: [userEventTopicArn, userMergeEventTopicArn],
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
new AccountDeleteMonitor(app, 'account-delete-monitor');
app.synth();
