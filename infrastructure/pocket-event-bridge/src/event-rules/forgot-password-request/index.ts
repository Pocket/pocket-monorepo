import { Construct } from 'constructs';
import {
  PocketEventBridgeProps,
  PocketEventBridgeRuleWithMultipleTargets,
  PocketPagerDuty,
} from '@pocket-tools/terraform-modules';
import { config } from '../../config';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { SnsTopicPolicy } from '@cdktf/provider-aws/lib/sns-topic-policy';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { Resource } from '@cdktf/provider-null/lib/resource';
import { eventConfig } from './eventConfig';
import { createDeadLetterQueueAlarm } from '../utils';

export class ForgotPassword extends Construct {
  public readonly snsTopic: SnsTopic;
  public readonly snsTopicDlq: SqsQueue;

  constructor(
    scope: Construct,
    private name: string,
    private pagerDuty: PocketPagerDuty,
  ) {
    super(scope, name);

    this.snsTopic = new SnsTopic(this, 'forgot-password-topic', {
      name: `${config.prefix}-${eventConfig.name}-Topic`,
      lifecycle: {
        preventDestroy: true,
      },
      tags: config.tags,
    });

    this.snsTopicDlq = new SqsQueue(this, 'sns-topic-dlq', {
      name: `${config.prefix}-${eventConfig.name}-SNS-Topic-Event-Rule-DLQ`,
      tags: config.tags,
    });

    const forgotPasswordRule = this.createForgotPasswordRequestRules();
    this.createPolicyForEventBridgeToSns();

    createDeadLetterQueueAlarm(
      this,
      pagerDuty,
      this.snsTopicDlq.name,
      `${eventConfig.name}-rule-dlq-alarm`,
    );

    new Resource(this, 'null-resource', {
      dependsOn: [forgotPasswordRule.getEventBridge().rule, this.snsTopic],
    });
  }

  /**
   * Rolls out event bridge rule and attaches them to sns target
   * for Forgot Password Request event
   * @private
   */
  private createForgotPasswordRequestRules() {
    const forgotPasswordRuleProps: PocketEventBridgeProps = {
      eventRule: {
        name: `${config.prefix}-${eventConfig.name}-Rule`,
        eventPattern: {
          source: [eventConfig.source],
          'detail-type': eventConfig.detailType,
        },
        eventBusName: eventConfig.bus,
        preventDestroy: true,
      },
      targets: [
        {
          arn: this.snsTopic.arn,
          deadLetterArn: this.snsTopicDlq.arn,
          targetId: `${config.prefix}-${eventConfig.name}-SNS-Target`,
          terraformResource: this.snsTopic,
        },
      ],
      tags: config.tags,
    };

    return new PocketEventBridgeRuleWithMultipleTargets(
      this,
      `${config.prefix}-${eventConfig.name}-EventBridge-Rule`,
      forgotPasswordRuleProps,
    );
  }

  private createPolicyForEventBridgeToSns() {
    const eventBridgeSnsPolicy = new DataAwsIamPolicyDocument(
      this,
      `${config.prefix}-EventBridge-SNS-Policy`,
      {
        statement: [
          {
            effect: 'Allow',
            actions: ['sns:Publish'],
            resources: [this.snsTopic.arn],
            principals: [
              {
                identifiers: ['events.amazonaws.com'],
                type: 'Service',
              },
            ],
          },
        ],
      },
    ).json;

    return new SnsTopicPolicy(this, 'forgot-password-sns-topic-policy', {
      arn: this.snsTopic.arn,
      policy: eventBridgeSnsPolicy,
    });
  }
}
