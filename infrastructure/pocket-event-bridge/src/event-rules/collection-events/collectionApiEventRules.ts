import { Construct } from 'constructs';
import {
  PocketEventBridgeProps,
  PocketEventBridgeRuleWithMultipleTargets,
  ApplicationEventBus,
} from '@pocket-tools/terraform-modules';
import { config } from '../../config';
import {
  sqsQueue,
  snsTopic,
  dataAwsIamPolicyDocument,
  snsTopicPolicy,
  dataAwsSnsTopic,
} from '@cdktf/provider-aws';
import { Resource } from '@cdktf/provider-null/lib/resource';
import { eventConfig } from './eventConfig';
import { createDeadLetterQueueAlarm } from '../utils';

export class CollectionApiEvents extends Construct {
  public readonly snsTopic: snsTopic.SnsTopic;
  public readonly snsTopicDlq: sqsQueue.SqsQueue;

  constructor(
    scope: Construct,
    private name: string,
    private sharedEventBus: ApplicationEventBus,
    private snsAlarmTopic: dataAwsSnsTopic.DataAwsSnsTopic,
  ) {
    super(scope, name);

    this.snsTopic = new snsTopic.SnsTopic(this, 'collection-event-topic', {
      name: `${config.prefix}-CollectionEventTopic`,
      lifecycle: {
        preventDestroy: true,
      },
    });

    this.snsTopicDlq = new sqsQueue.SqsQueue(this, 'sns-topic-dql', {
      name: `${config.prefix}-SNS-${eventConfig.name}-Event-Rule-DLQ`,
      tags: config.tags,
    });

    const collectionEvent = this.createCollectionEventRules();
    this.createPolicyForEventBridgeToSns();

    //get alerted if we get 10 messages in DLQ in 4 evaluation period of 5 minutes
    createDeadLetterQueueAlarm(
      this,
      snsAlarmTopic,
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
      dependsOn: [collectionEvent.getEventBridge().rule, this.snsTopic],
    });
  }

  /**
   * Rolls out event bridge rule and attaches them to sns target
   * for collection-events
   * @private
   */
  private createCollectionEventRules() {
    const collectionEventRuleProps: PocketEventBridgeProps = {
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
          targetId: `${config.prefix}-Collection-Event-SNS-Target`,
          terraformResource: this.snsTopic,
        },
      ],
    };
    return new PocketEventBridgeRuleWithMultipleTargets(
      this,
      `${config.prefix}-Collection-Api-EventBridge-Rule`,
      collectionEventRuleProps,
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
      'collection-events-sns-topic-policy',
      {
        arn: this.snsTopic.arn,
        policy: eventBridgeSnsPolicy,
      },
    );
  }
}
