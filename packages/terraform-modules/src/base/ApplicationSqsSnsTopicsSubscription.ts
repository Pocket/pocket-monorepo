import {
  dataAwsIamPolicyDocument,
  snsTopicSubscription,
  sqsQueue,
  sqsQueuePolicy,
  dataAwsSqsQueue,
} from '@cdktf/provider-aws';
import { type SnsTopicSubscriptionConfig } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { TerraformMetaArguments, TerraformResource } from 'cdktf';
import { Construct } from 'constructs';

export interface SnsSqsSubscriptionProps {
  name: string;
  snsTopicArn: string;
  snsDlq?: sqsQueue.SqsQueue;
  filterPolicy?: SnsTopicSubscriptionConfig['filterPolicy'];
  filterPolicyScope?: SnsTopicSubscriptionConfig['filterPolicyScope'];
}

export interface ApplicationSqsSnsTopicsSubscriptionProps
  extends TerraformMetaArguments {
  subscriptions: SnsSqsSubscriptionProps[];
  name: string;
  sqsQueue: sqsQueue.SqsQueue | dataAwsSqsQueue.DataAwsSqsQueue;
  tags?: { [key: string]: string };
  dependsOn?: TerraformResource[];
}

/**
 * Creates an SNS to SQS subscription, allowing an SQS queue to
 * subscribe to multiple topics (in the rare case where this pattern
 * is useful)
 */
export class ApplicationSqsSnsTopicsSubscription extends Construct {
  public readonly snsTopicSubscriptions: snsTopicSubscription.SnsTopicSubscription[];

  constructor(
    scope: Construct,
    name: string,
    private config: ApplicationSqsSnsTopicsSubscriptionProps,
  ) {
    super(scope, name);
    const subscriptions = config.subscriptions.map((sub) => ({
      ...sub,
      snsDlq: sub.snsDlq ?? this.createSqsSubscriptionDlq(sub.name),
    }));
    this.snsTopicSubscriptions = subscriptions.map((sub) => {
      return this.createSnsTopicSubscription(sub);
    });
    this.createPoliciesForSnsToSQS(subscriptions);
  }

  /**
   * Create a dead-letter queue for failed SNS messages
   * @private
   */
  private createSqsSubscriptionDlq(name: string): sqsQueue.SqsQueue {
    return new sqsQueue.SqsQueue(this, `${name}-sns-topic-dql`, {
      name: `${name}-SNS-Topic-DLQ`,
      tags: this.config.tags,
      provider: this.config.provider,
    });
  }

  /**
   * Create an SNS subscription for SQS
   * @param snsTopicDlq
   * @private
   */
  private createSnsTopicSubscription(
    properties: Omit<SnsSqsSubscriptionProps, 'snsDlq'> & {
      snsDlq: sqsQueue.SqsQueue;
    },
  ): snsTopicSubscription.SnsTopicSubscription {
    return new snsTopicSubscription.SnsTopicSubscription(
      this,
      `${properties.name}-sns-subscription`,
      {
        topicArn: properties.snsTopicArn,
        protocol: 'sqs',
        endpoint: this.config.sqsQueue.arn,
        redrivePolicy: JSON.stringify({
          deadLetterTargetArn: properties.snsDlq.arn,
        }),
        filterPolicy: properties.filterPolicy,
        filterPolicyScope: properties.filterPolicyScope,
        dependsOn: [
          properties.snsDlq,
          ...(this.config.dependsOn ? this.config.dependsOn : []),
        ],
        provider: this.config.provider,
      } as snsTopicSubscription.SnsTopicSubscriptionConfig,
    );
  }

  /**
   * Create IAM policies to allow SNS to write to the target SQS queue and a
   * dead-letter queue
   * @param snsTopicDlq
   * @private
   */
  private createPoliciesForSnsToSQS(
    subscriptions: Array<
      Omit<SnsSqsSubscriptionProps, 'snsDlq'> & {
        snsDlq: sqsQueue.SqsQueue;
      }
    >,
  ): void {
    // Make DLQ policies first since they are separate
    subscriptions.forEach((sub) => {
      const policy = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        `${sub.name}-sns-dlq-policy-document`,
        {
          statement: [
            {
              effect: 'Allow',
              actions: ['sqs:SendMessage'],
              resources: [sub.snsDlq.arn],
              principals: [
                {
                  identifiers: ['sns.amazonaws.com'],
                  type: 'Service',
                },
              ],
              condition: [
                {
                  test: 'ArnEquals',
                  variable: 'aws:SourceArn',
                  values: [sub.snsTopicArn],
                },
              ],
            },
          ],
          dependsOn: [sub.snsDlq] as TerraformResource[],
          provider: this.config.provider,
        },
      ).json;

      return new sqsQueuePolicy.SqsQueuePolicy(
        this,
        `${sub.name}-sns-dlq-policy`,
        {
          queueUrl: sub.snsDlq.url,
          policy: policy,
          provider: this.config.provider,
        },
      );
    });

    const queuePolicyDoc =
      new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        `${this.config.name}-sns-sqs-policy-document`,
        {
          statement: [
            {
              effect: 'Allow',
              actions: ['sqs:SendMessage'],
              resources: [this.config.sqsQueue.arn],
              principals: [
                {
                  identifiers: ['sns.amazonaws.com'],
                  type: 'Service',
                },
              ],
              condition: [
                {
                  test: 'ArnEquals',
                  variable: 'aws:SourceArn',
                  values: subscriptions.map((sub) => sub.snsTopicArn),
                },
              ],
            },
          ],
          dependsOn: [this.config.sqsQueue] as TerraformResource[],
          provider: this.config.provider,
        },
      ).json;

    new sqsQueuePolicy.SqsQueuePolicy(
      this,
      `${this.config.name}-sns-sqs-policy`,
      {
        queueUrl: this.config.sqsQueue.url,
        policy: queuePolicyDoc,
        provider: this.config.provider,
      },
    );
  }
}
