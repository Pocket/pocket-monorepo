import { Construct } from 'constructs';
import {
  PocketEventBridgeProps,
  PocketEventBridgeRuleWithMultipleTargets,
  ApplicationEventBus,
  PocketPagerDuty,
} from '@pocket-tools/terraform-modules';
import { config } from '../../config';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { CloudwatchLogResourcePolicy } from '@cdktf/provider-aws/lib/cloudwatch-log-resource-policy';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

import { Resource } from '@cdktf/provider-null/lib/resource';
import { eventConfig } from './eventConfig';

export class AllEventsRule extends Construct {
  public readonly cloudwatchLogGroup: CloudwatchLogGroup;

  constructor(
    scope: Construct,
    name: string,
    private sharedEventBus: ApplicationEventBus,
    private pagerDuty: PocketPagerDuty,
  ) {
    super(scope, name);

    this.cloudwatchLogGroup = this.createLogGroup();
    this.createPolicyForEventBridgeToCloudwatch(this.cloudwatchLogGroup);
    const allEvents = this.createAllEventRules(this.cloudwatchLogGroup);

    //place-holder resource used to make sure we are not
    //removing the event-rule or the SNS by mistake
    //if the resources are removed, this would act as an additional check
    //to prevent resource deletion in-addition to preventDestroy
    //e.g removing any of the dependsOn resource and running npm build would
    //throw error
    new Resource(this, 'null-resource', {
      dependsOn: [allEvents.getEventBridge().rule, this.cloudwatchLogGroup],
    });
  }

  private createLogGroup() {
    return new CloudwatchLogGroup(this, 'all-event-log-group', {
      name: `/aws/events/${config.name}/AllEvents`,
      retentionInDays: 14,
    });
  }

  /**
   * Rolls out event bridge rule and attaches them to sns target
   * for collection-events
   * @private
   */
  private createAllEventRules(logGroup: CloudwatchLogGroup) {
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
          arn: logGroup.arn,
          targetId: `${config.prefix}-All-Events-CloudWatch-Target`,
          terraformResource: logGroup,
        },
      ],
    };
    return new PocketEventBridgeRuleWithMultipleTargets(
      this,
      `${config.prefix}-AllEvents-EventBridge-Rule`,
      allEventRuleProps,
    );
  }

  private createPolicyForEventBridgeToCloudwatch(logGroup: CloudwatchLogGroup) {
    const eventBridgeCloudwatchPolicy = new DataAwsIamPolicyDocument(
      this,
      `${config.prefix}-EventBridge-Cloudwatch-Policy`,
      {
        statement: [
          {
            effect: 'Allow',
            actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            resources: [
              `arn:aws:logs:${new DataAwsRegion(this, 'region').name}:${new DataAwsCallerIdentity(this, 'caller').accountId}:log-group:/aws/events/*:*`,
            ],
            principals: [
              {
                identifiers: [
                  'events.amazonaws.com',
                  'delivery.logs.amazonaws.com',
                ],
                type: 'Service',
              },
            ],
          },
        ],
      },
    ).json;

    return new CloudwatchLogResourcePolicy(
      this,
      'all-events-cloudwatch-policy',
      {
        policyName: `${config.prefix}-AllEvents-CloudwatchPolicy`,
        policyDocument: eventBridgeCloudwatchPolicy,
      },
    );
  }
}
