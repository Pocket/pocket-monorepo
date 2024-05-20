import { Construct } from 'constructs';
import {
  PocketEventBridgeProps,
  PocketEventBridgeRuleWithMultipleTargets,
  ApplicationEventBus,
  PocketPagerDuty,
} from '@pocket-tools/terraform-modules';
import { config } from '../../config';
import {
  sqsQueue,
  snsTopic,
  dataAwsIamPolicyDocument,
  snsTopicPolicy,
} from '@cdktf/provider-aws';
import { resource } from '@cdktf/provider-null';
import { eventConfig } from './eventConfig';
import { createDeadLetterQueueAlarm } from '../utils';

export class CorpusEvents extends Construct {
  public readonly snsTopic: snsTopic.SnsTopic;
  public readonly snsTopicDlq: sqsQueue.SqsQueue;

  constructor(
    scope: Construct,
    private name: string,
    private pagerDuty: PocketPagerDuty,
  ) {
    super(scope, name);

    this.snsTopic = new snsTopic.SnsTopic(this, 'corpusevents-event-topic', {
      name: `${config.prefix}-CorpusEventsTopic`,
      lifecycle: {
        preventDestroy: true,
      },
    });

    this.snsTopicDlq = new sqsQueue.SqsQueue(this, 'sns-topic-dlq', {
      name: `${config.prefix}-SNS-${eventConfig.CorpusItem.name}-Topic-DLQ`,
      tags: config.tags,
    });

    const shareableListEvent = this.createCorpusEventRules();
    this.createPolicyForEventBridgeToSns();

    //get alerted if we get 10 messages in DLQ in 4 evaluation period of 5 minutes (for shareable-list)
    createDeadLetterQueueAlarm(
      this,
      pagerDuty,
      this.snsTopicDlq.name,
      `${eventConfig.CorpusItem.name}-Rule-dlq-alarm`,
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
    new resource.Resource(this, 'null-resource', {
      dependsOn: [shareableListEvent.getEventBridge().rule, this.snsTopic],
    });
  }

  /**
   * Rolls out event bridge rule and attaches them to sns target
   * for sharesapi-events
   * @private
   */
  private createCorpusEventRules() {
    const corpusEventRuleProps: PocketEventBridgeProps = {
      eventRule: {
        name: `${config.prefix}-${eventConfig.CorpusItem.name}-Rule`,
        eventPattern: {
          source: [eventConfig.CorpusItem.source],
          'detail-type': eventConfig.CorpusItem.detailType,
        },
        // These events are emitted by the default bus, not the shared bus
        eventBusName: 'default',
        preventDestroy: true,
      },
      targets: [
        {
          arn: this.snsTopic.arn,
          deadLetterArn: this.snsTopicDlq.arn,
          targetId: `${config.prefix}-CorpusEvents-Event-SNS-Target`,
          terraformResource: this.snsTopic,
        },
      ],
    };
    return new PocketEventBridgeRuleWithMultipleTargets(
      this,
      `${config.prefix}-CorpusEvents-EventBridge-Rule`,
      corpusEventRuleProps,
    );
  }

  private createPolicyForEventBridgeToSns() {
    const eventBridgeSnsPolicy =
      new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        `${config.prefix}-CorpusEvents-SNS-Policy`,
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
      'corpusevents-events-sns-topic-policy',
      {
        arn: this.snsTopic.arn,
        policy: eventBridgeSnsPolicy,
      },
    );
  }
}
