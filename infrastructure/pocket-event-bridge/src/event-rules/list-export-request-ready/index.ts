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
import type { ApplicationEventBus } from '@pocket-tools/terraform-modules';

export class ListExportReady extends Construct {
  public readonly snsTopic: snsTopic.SnsTopic;
  public readonly snsTopicDlq: sqsQueue.SqsQueue;

  constructor(
    scope: Construct,
    private name: string,
    private sharedEventBus: ApplicationEventBus,
    private snsAlarmTopic: dataAwsSnsTopic.DataAwsSnsTopic,
  ) {
    super(scope, name);

    // TBH having this SNS topic is overkill because I don't think we're
    // going to be connecting more targets to event bridge rule than the
    // maximum allowed, but this is the pattern that is easily reusable here,
    // also taking into account the downstream Transactional Email lambda
    // infrastructure
    this.snsTopic = new snsTopic.SnsTopic(this, 'export-request-ready-topic', {
      name: `${config.prefix}-${eventConfig.name}-Topic`,
      lifecycle: {
        preventDestroy: true,
      },
      tags: config.tags,
    });

    this.snsTopicDlq = new sqsQueue.SqsQueue(this, 'sns-topic-dlq', {
      name: `${config.prefix}-${eventConfig.name}-SNS-Topic-Event-Rule-DLQ`,
      tags: config.tags,
    });

    const exportReadyRule = this.createExportReadyRules();
    this.createPolicyForEventBridgeToSns();

    createDeadLetterQueueAlarm(
      this,
      snsAlarmTopic,
      this.snsTopicDlq.name,
      `${eventConfig.name}-rule-dlq-alarm`,
    );

    new resource.Resource(this, 'null-resource', {
      dependsOn: [exportReadyRule.getEventBridge().rule, this.snsTopic],
    });
  }

  /**
   * Rolls out event bridge rule and attaches them to sns target
   * for List Export Ready event
   * @private
   */
  private createExportReadyRules() {
    const exportRequestReadyRuleProps: PocketEventBridgeProps = {
      eventRule: {
        name: `${config.prefix}-${eventConfig.name}-Rule`,
        eventPattern: {
          source: [eventConfig.source],
          'detail-type': eventConfig.detailType,
        },
        eventBusName: this.sharedEventBus.bus.name,
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
      exportRequestReadyRuleProps,
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
      'export-request-ready-sns-topic-policy',
      {
        arn: this.snsTopic.arn,
        policy: eventBridgeSnsPolicy,
      },
    );
  }
}
