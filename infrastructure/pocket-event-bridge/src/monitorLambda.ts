import { Construct } from 'constructs';
import { config } from './config';
import { DataAwsSsmParameter } from '@cdktf/provider-aws/lib/data-aws-ssm-parameter';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { SqsQueuePolicy } from '@cdktf/provider-aws/lib/sqs-queue-policy';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import {
  PocketVPC,
  PocketSQSWithLambdaTarget,
  PocketPagerDuty,
  LAMBDA_RUNTIMES,
} from '@pocket-tools/terraform-modules';
import { AllEventsRule } from './event-rules/all-events/allEventRules';

export class PocketEventBridegeMonitorLambda extends Construct {
  public readonly construct: PocketSQSWithLambdaTarget;
  constructor(
    scope: Construct,
    private name: string,
    allEventsRule: AllEventsRule,
    pagerDuty?: PocketPagerDuty,
  ) {
    super(scope, name);

    const { sentryDsn, gitSha } = this.getEnvVariableValues();
    const vpc = new PocketVPC(this, 'pocket-vpc');

    this.construct = new PocketSQSWithLambdaTarget(this, 'monitor', {
      name: `${config.prefix}-Monitor`,
      batchSize: 10,
      batchWindow: 60,
      sqsQueue: {
        maxReceiveCount: 3,
        visibilityTimeoutSeconds: 300,
      },
      lambda: {
        runtime: LAMBDA_RUNTIMES.NODEJS20,
        handler: 'index.handler',
        timeout: 120,
        environment: {
          SENTRY_DSN: sentryDsn,
          GIT_SHA: gitSha,
          NODE_ENV:
            config.environment === 'Prod' ? 'production' : 'development',
        },
        vpcConfig: {
          securityGroupIds: vpc.defaultSecurityGroups.ids,
          subnetIds: vpc.privateSubnetIds,
        },
        codeDeploy: {
          region: vpc.region,
          accountId: vpc.accountId,
        },
        executionPolicyStatements: [
          {
            effect: 'Allow',
            actions: ['ssm:GetParameter*'],
            resources: [
              `arn:aws:ssm:${vpc.region}:${vpc.accountId}:parameter/${config.name}/${config.environment}`,
              `arn:aws:ssm:${vpc.region}:${vpc.accountId}:parameter/${config.name}/${config.environment}/*`,
            ],
          },
        ],
        alarms: {
          //alert if we have 150 errors in 4 eval period of 15 mins (1 hr)
          errors: {
            evaluationPeriods: 4,
            period: 900, //15 minutes
            threshold: 150,
            actions: config.isDev
              ? []
              : [pagerDuty!.snsNonCriticalAlarmTopic.arn],
          },
        },
      },
      tags: config.tags,
    });

    const snsTopicDlq = new SqsQueue(this, 'sns-topic-dlq', {
      name: `${config.prefix}-Monitor-SNS-Topics-DLQ`,
      tags: config.tags,
    });

    this.subscribeSqsToSnsTopic(
      this.construct,
      snsTopicDlq,
      allEventsRule.snsTopic.arn,
      `${config.prefix}-Monitor`,
    );

    this.createPoliciesForSQSQueue(
      this.construct.applicationSqsQueue.sqsQueue,
      snsTopicDlq,
      [allEventsRule.snsTopic.arn],
    );
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
    sqsLambda: PocketSQSWithLambdaTarget,
    snsTopicDlq: SqsQueue,
    snsTopicArn: string,
    topicName: string,
  ) {
    // This Topic already exists and is managed elsewhere
    return new SnsTopicSubscription(this, `${topicName}-sns-subscription`, {
      topicArn: snsTopicArn,
      protocol: 'sqs',
      endpoint: sqsLambda.applicationSqsQueue.sqsQueue.arn,
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
  private createPoliciesForSQSQueue(
    snsTopicQueue: SqsQueue,
    snsTopicDlq: SqsQueue,
    snsTopicArns: string[],
  ): void {
    [
      { name: 'montior-sns-sqs', resource: snsTopicQueue },
      { name: 'monitor-sns-dlq', resource: snsTopicDlq },
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

  private getEnvVariableValues() {
    const sentryDsn = new DataAwsSsmParameter(this, 'sentry-dsn', {
      name: `/${config.name}/${config.environment}/SENTRY_DSN`,
    });

    const serviceHash = new DataAwsSsmParameter(this, 'service-hash', {
      name: `${config.circleCIPrefix}/SERVICE_HASH`,
    });

    return { sentryDsn: sentryDsn.value, gitSha: serviceHash.value };
  }
}
