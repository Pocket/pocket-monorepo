import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import {
  provider as awsProvider,
  dataAwsRegion,
  dataAwsCallerIdentity,
  sqsQueue,
  sqsQueuePolicy,
  snsTopicSubscription,
  dataAwsIamPolicyDocument,
  dataAwsSnsTopic,
} from '@cdktf/provider-aws';
import { provider as nullProvider } from '@cdktf/provider-null';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as archiveProvider } from '@cdktf/provider-archive';
import { config } from './config/index.ts';
import { PocketVPC } from '@pocket-tools/terraform-modules';
import * as fs from 'fs';
import { TransactionalEmailSQSLambda } from './transactionalEmailSQSLambda.ts';

class TransactionalEmails extends TerraformStack {
  constructor(scope: Construct, name: string) {
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
    const pocketVpc = new PocketVPC(this, 'pocket-vpc');

    const sqsLambda = new TransactionalEmailSQSLambda(
      this,
      'events',
      pocketVpc,
      this.getAlarmSnsTopic(),
    );

    //dlq for sqs-sns subscription
    const snsTopicDlq = new sqsQueue.SqsQueue(this, 'sns-topic-dlq', {
      name: `${config.prefix}-SNS-Topics-DLQ`,
      tags: config.tags,
    });

    const topicArns = config.eventBridge.topics.map((topic) => {
      const topicArn = `arn:aws:sns:${region.name}:${caller.accountId}:${config.eventBridge.prefix}-${config.environment}-${topic}`;
      this.subscribeSqsToSnsTopic(sqsLambda, snsTopicDlq, topicArn, topic);
      return topicArn;
    });

    this.createPoliciesForTransactionalEmailSQSQueue(
      sqsLambda.construct.applicationSqsQueue.sqsQueue,
      snsTopicDlq,
      topicArns,
    );
  }

  /**
   * Get the sns topic for alarms
   * @private
   */
  private getAlarmSnsTopic() {
    return new dataAwsSnsTopic.DataAwsSnsTopic(this, 'backend_notifications', {
      name: `Backend-${config.environment}-ChatBot`,
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
        endpoint: sqsLambda.construct.applicationSqsQueue.sqsQueue.arn,
        redrivePolicy: JSON.stringify({
          deadLetterTargetArn: snsTopicDlq.arn,
        }),
      },
    );
  }

  /**
   *
   * @param snsTopicQueue SQS that triggers the lambda
   * @param snsTopicDlq DLQ to which the messages will be forwarded if SQS is down
   * @param snsTopicArns list of SNS topic to which we want to subscribe to
   * @private
   */
  private createPoliciesForTransactionalEmailSQSQueue(
    snsTopicQueue: sqsQueue.SqsQueue,
    snsTopicDlq: sqsQueue.SqsQueue,
    snsTopicArns: string[],
  ): void {
    [
      { name: 'transactional-email-sns-sqs', resource: snsTopicQueue },
      { name: 'transactional-email-sns-dlq', resource: snsTopicDlq },
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
                  //add any sns topic to this list that we want this SQS to listen to
                  values: snsTopicArns,
                },
              ],
            },
            //add any other subscription policy for this SQS
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
const stack = new TransactionalEmails(app, 'transactional-emails');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
