import { Construct } from 'constructs';
import {
  PocketEventBridgeProps,
  PocketEventBridgeRuleWithMultipleTargets,
  ApplicationEventBus,
  PocketPagerDuty,
} from '@pocket-tools/terraform-modules';
import { config } from '../../config';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { SnsTopicPolicy } from '@cdktf/provider-aws/lib/sns-topic-policy';
import { Resource } from '@cdktf/provider-null/lib/resource';
import { createDeadLetterQueueAlarm } from '../utils';
import { eventConfig } from './eventConfig';

export class AllEventsRule extends Construct {
  public readonly snsTopic: SnsTopic;
  public readonly snsTopicDlq: SqsQueue;

  constructor(
    scope: Construct,
    name: string,
    private sharedEventBus: ApplicationEventBus,
    private pagerDuty: PocketPagerDuty,
  ) {
    super(scope, name);

    this.snsTopic = new SnsTopic(this, 'all-events-topic', {
      name: `${config.prefix}-AllEventTopic`,
      lifecycle: {
        preventDestroy: true,
      },
    });

    this.snsTopicDlq = new SqsQueue(this, 'sns-topic-dql', {
      name: `${config.prefix}-SNS-${eventConfig.name}-Event-Rule-DLQ`,
      tags: config.tags,
    });

    const allEvents = this.createAllEventRules();
    this.createPolicyForEventBridgeToSns();

    //get alerted if we get 10 messages in DLQ in 4 evaluation period of 5 minutes
    createDeadLetterQueueAlarm(
      this,
      this.pagerDuty,
      this.snsTopicDlq.name,
      `${eventConfig.name}-Rule-dlq-alarm`,
      true,
      4,
      300,
      10,
    );

    //place-holder resource used to make sure we are not
    //removing the event-rule or the SNS by mistake
    //if the resources are removed, this would act as an additional check
    //to prevent resource deletion in-addition to preventDestroy
    //e.g removing any of the dependsOn resource and running npm build would
    //throw error
    new Resource(this, 'null-resource', {
      dependsOn: [allEvents.getEventBridge().rule, this.snsTopic],
    });
  }

  /**
   * Rolls out event bridge rule and attaches them to sns target
   * for collection-events
   * @private
   */
  private createAllEventRules() {
    const allEventRuleProps: PocketEventBridgeProps = {
      eventRule: {
        name: `${config.prefix}-${eventConfig.name}-Rule`,
        eventPattern: {
          'detail-type': [
            {
              exists: true,
            },
          ],
        },
        eventBusName: this.sharedEventBus.bus.name,
        preventDestroy: true,
      },
      targets: [
        {
          arn: this.snsTopic.arn,
          deadLetterArn: this.snsTopicDlq.arn,
          targetId: `${config.prefix}-All-Events-SNS-Target`,
          terraformResource: this.snsTopic,
        },
      ],
    };
    return new PocketEventBridgeRuleWithMultipleTargets(
      this,
      `${config.prefix}-AllEvents-EventBridge-Rule`,
      allEventRuleProps,
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

    return new SnsTopicPolicy(this, 'all-events-sns-topic-policy', {
      arn: this.snsTopic.arn,
      policy: eventBridgeSnsPolicy,
    });
  }
}
