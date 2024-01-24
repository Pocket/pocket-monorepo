import { Construct } from 'constructs';
import {
  PocketEventBridgeProps,
  PocketEventBridgeRuleWithMultipleTargets,
  PocketPagerDuty,
} from '@pocket-tools/terraform-modules';
import { config } from '../../config';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { SnsTopicPolicy } from '@cdktf/provider-aws/lib/sns-topic-policy';
import { Resource } from '@cdktf/provider-null/lib/resource';
import { eventConfig } from './eventConfig';

export class UserRegistrationEventRule extends Resource {
  public readonly snsTopic: SnsTopic;
  public readonly snsTopicDlq: SqsQueue;

  constructor(
    scope: Construct,
    private name: string,
    private pagerDuty: PocketPagerDuty,
  ) {
    super(scope, name);

    this.snsTopic = new SnsTopic(this, 'user-registration-topic', {
      name: `${config.prefix}-UserRegistrationTopic`,
      lifecycle: {
        preventDestroy: true,
      },
    });

    this.snsTopicDlq = new SqsQueue(this, 'sns-topic-dql', {
      name: `${config.prefix}-SNS-${eventConfig.name}-Topic--DLQ`,
      tags: config.tags,
    });

    const userRegistrationEvent = this.createUserRegistrationEventRules();
    this.createPolicyForEventBridgeToSns();

    //todo: set DLQ alert after the chores ticket

    //place-holder resource used to make sure we are not
    //removing the event-rule or the SNS by mistake
    //if the resources are removed, this would act as an additional check
    //to prevent resource deletion in-addition to preventDestroy
    //e.g removing any of the dependsOn resource and running npm build would
    //throw error
    new Resource(this, 'null-resource', {
      dependsOn: [userRegistrationEvent.getEventBridge().rule, this.snsTopic],
    });
  }

  /**
   * Rolls out event bridge rule and attaches them to sns target
   * for user-registration-events
   * @private
   */
  private createUserRegistrationEventRules() {
    const userRegistrationEventRuleProps: PocketEventBridgeProps = {
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
          targetId: `${config.prefix}-User-Registration-Event-SNS-Target`,
          terraformResource: this.snsTopic,
        },
      ],
    };
    return new PocketEventBridgeRuleWithMultipleTargets(
      this,
      `${config.prefix}-User-Registration-EventBridge-Rule`,
      userRegistrationEventRuleProps,
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

    return new SnsTopicPolicy(
      this,
      'user-registration-events-sns-topic-policy',
      {
        arn: this.snsTopic.arn,
        policy: eventBridgeSnsPolicy,
      },
    );
  }
}
