import { Construct } from 'constructs';
import {
  PocketEventBridgeProps,
  PocketEventBridgeRuleWithMultipleTargets,
  PocketPagerDuty,
} from '@pocket-tools/terraform-modules';
import { config } from '../../config/index.js';
import { config as admConfig } from './config.js';
import { createDeadLetterQueueAlarm } from '../utils.js';
import {
  dataAwsSqsQueue,
  snsTopic,
  dataAwsIamPolicyDocument,
  snsTopicPolicy,
  sqsQueue,
} from '@cdktf/provider-aws';
import { Resource } from '@cdktf/provider-null/lib/resource';

export class AccountDeleteMonitorEvents extends Construct {
  public readonly sqs: dataAwsSqsQueue.DataAwsSqsQueue;
  public readonly sqsDlq: dataAwsSqsQueue.DataAwsSqsQueue;
  public readonly UserMergeTopic: snsTopic.SnsTopic;

  constructor(
    scope: Construct,
    name: string,
    private pagerDuty: PocketPagerDuty,
  ) {
    super(scope, name);
    // pre-existing queues (prod and dev) created by account-delete-monitor
    this.sqs = new dataAwsSqsQueue.DataAwsSqsQueue(
      this,
      `${admConfig.prefix}-queue`,
      {
        name: `${admConfig.prefix}-${admConfig.queueCheckDelete.name}-Queue`,
      },
    );

    this.sqsDlq = new dataAwsSqsQueue.DataAwsSqsQueue(
      this,
      `${admConfig.prefix}-queue-dlq`,
      {
        name: `${admConfig.prefix}-${admConfig.queueCheckDelete.name}-Queue-Deadletter`,
      },
    );

    this.createAdmRules();
    //todo: revisit - the scheduled event will need iam permission to trigger sqs

    this.UserMergeTopic = new snsTopic.SnsTopic(this, 'user-merge-topic', {
      name: `${config.prefix}-${admConfig.userMerge.name}-Topic`,
      lifecycle: {
        preventDestroy: true,
      },
    });
    const userMergeRule = this.createUserMergeRules();
    this.createPolicyForEventBridgeToSns();

    createDeadLetterQueueAlarm(
      this,
      pagerDuty,
      this.sqsDlq.name,
      `${config.prefix}-Dlq-Alarm`,
    );

    new Resource(this, 'null-resource', {
      dependsOn: [userMergeRule.getEventBridge().rule, this.UserMergeTopic],
    });
  }

  /**
   * Rolls out event bridge rule and attaches them to SQS target
   * for account-delete-monitor events
   * @private
   */
  private createAdmRules() {
    const userEventRuleProps: PocketEventBridgeProps = {
      eventRule: {
        name: `${config.prefix}-${admConfig.queueCheckDelete.name}-Rule`,
        scheduleExpression: admConfig.queueCheckDelete.scheduleExpression,
        eventBusName: admConfig.queueCheckDelete.bus,
      },
      targets: [
        {
          arn: this.sqs.arn,
          deadLetterArn: this.sqsDlq.arn,
          targetId: `${admConfig.prefix}-${admConfig.queueCheckDelete.name}-Rule-Target`,
        },
      ],
    };

    return new PocketEventBridgeRuleWithMultipleTargets(
      this,
      `${config.prefix}-${admConfig.queueCheckDelete.name}-EventBridge-Rule`,
      userEventRuleProps,
    );
  }

  /**
   * rule that attaches `user-merge` event from web repo to the
   * sns topic
   * @private
   */
  private createUserMergeRules() {
    const snsTopicDlq = new sqsQueue.SqsQueue(this, 'sns-topic-dql', {
      name: `${config.prefix}-${admConfig.userMerge.name}-SNS-Topic-DLQ`,
      tags: config.tags,
    });

    const userEventRuleProps: PocketEventBridgeProps = {
      eventRule: {
        name: `${config.prefix}-${admConfig.userMerge.name}-Rule`,
        eventPattern: {
          source: [admConfig.userMerge.source],
          'detail-type': admConfig.userMerge.detailType,
        },
        eventBusName: admConfig.userMerge.bus,
        preventDestroy: true,
      },
      targets: [
        {
          arn: this.UserMergeTopic.arn,
          deadLetterArn: snsTopicDlq.arn,
          targetId: `${admConfig.prefix}-${admConfig.userMerge.name}-Rule-Target`,
          terraformResource: this.UserMergeTopic,
        },
      ],
    };

    return new PocketEventBridgeRuleWithMultipleTargets(
      this,
      `${config.prefix}-${admConfig.userMerge.name}-EventBridge-Rule`,
      userEventRuleProps,
    );
  }

  /**
   * policy attachment for event-bridge rule with sns
   * @private
   */
  private createPolicyForEventBridgeToSns() {
    const eventBridgeSnsPolicy =
      new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        `${config.prefix}-EventBridge-SNS-Policy`,
        {
          statement: [
            {
              effect: 'Allow',
              actions: ['sns:Publish'],
              resources: [this.UserMergeTopic.arn],
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

    return new snsTopicPolicy.SnsTopicPolicy(
      this,
      'user-events-sns-topic-policy',
      {
        arn: this.UserMergeTopic.arn,
        policy: eventBridgeSnsPolicy,
      },
    );
  }
}
