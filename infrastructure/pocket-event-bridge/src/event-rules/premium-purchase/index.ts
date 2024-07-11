import { Construct } from 'constructs';
import {
  PocketEventBridgeProps,
  PocketEventBridgeRuleWithMultipleTargets,
} from '@pocket-tools/terraform-modules';
import { config } from '../../config';
import {
  snsTopic,
  dataAwsIamPolicyDocument,
  snsTopicPolicy,
  sqsQueue,
  dataAwsSnsTopic,
} from '@cdktf/provider-aws';
import { resource } from '@cdktf/provider-null';
import { eventConfig } from './eventConfig';
import { createDeadLetterQueueAlarm } from '../utils';

export class PremiumPurchase extends Construct {
  public readonly snsTopic: snsTopic.SnsTopic;
  public readonly snsTopicDlq: sqsQueue.SqsQueue;

  constructor(
    scope: Construct,
    private name: string,
    private snsAlarmTopic: dataAwsSnsTopic.DataAwsSnsTopic,
  ) {
    super(scope, name);

    this.snsTopic = new snsTopic.SnsTopic(this, 'premium-purchase-topic', {
      name: `${config.prefix}-${eventConfig.name}-Topic`,
      lifecycle: {
        preventDestroy: true,
      },
    });

    this.snsTopicDlq = new sqsQueue.SqsQueue(this, 'sns-topic-dlq', {
      name: `${config.prefix}-${eventConfig.name}-SNS-Topic-Event-Rule-DLQ`,
      tags: config.tags,
    });

    const premiumPurchaseRule = this.createPremiumPurchaseRules();
    this.createPolicyForEventBridgeToSns();

    createDeadLetterQueueAlarm(
      this,
      snsAlarmTopic,
      this.snsTopicDlq.name,
      `${eventConfig.name}-rule-dlq-alarm`,
    );

    new resource.Resource(this, 'null-resource', {
      dependsOn: [premiumPurchaseRule.getEventBridge().rule, this.snsTopic],
    });
  }

  /**
   * Rolls out event bridge rule and attaches them to sns target
   * for premium-purchase event
   * @private
   */
  private createPremiumPurchaseRules() {
    const premiumPurchaseRuleProps: PocketEventBridgeProps = {
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
    };

    return new PocketEventBridgeRuleWithMultipleTargets(
      this,
      `${config.prefix}-${eventConfig.name}-EventBridge-Rule`,
      premiumPurchaseRuleProps,
    );
  }

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

    return new snsTopicPolicy.SnsTopicPolicy(
      this,
      'premium-purchase-sns-topic-policy',
      {
        arn: this.snsTopic.arn,
        policy: eventBridgeSnsPolicy,
      },
    );
  }
}
