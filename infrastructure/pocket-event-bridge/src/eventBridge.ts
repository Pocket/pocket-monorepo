import { Construct } from 'constructs';
import { PocketEventType } from '@pocket-tools/event-bridge';
import {
  PocketEventBridgeProps,
  PocketEventBridgeRuleWithMultipleTargets,
} from '@pocket-tools/terraform-modules';
import {
  dataAwsIamPolicyDocument,
  dataAwsSnsTopic,
  snsTopic,
  snsTopicPolicy,
  sqsQueue,
} from '@cdktf/provider-aws';
import { createDeadLetterQueueAlarm } from './event-rules/utils.ts';
import { config } from './config/index.ts';

export interface PocketEventToTopicProps {
  eventBusName: string;
  prefix: string;
  name: string;
  tags: { [key: string]: string };
  // Used to create a specific topic name, mainly used because there could be other infra depending on a specific name.
  topicName?: string;
  snsAlarmTopic?: dataAwsSnsTopic.DataAwsSnsTopic;
  eventPattern: { 'detail-type': PocketEventType[]; source?: string[] };
}

export class PocketEventToTopic extends Construct {
  public readonly snsTopic: snsTopic.SnsTopic;
  public readonly snsTopicDlq: sqsQueue.SqsQueue;

  constructor(
    scope: Construct,
    private readonly id: string,
    private readonly config: PocketEventToTopicProps,
  ) {
    super(scope, id);

    this.snsTopic = new snsTopic.SnsTopic(this, 'events-topic', {
      name: config.topicName ?? `${config.prefix}-${config.name}`,
    });

    this.snsTopicDlq = new sqsQueue.SqsQueue(this, 'sns-topic-dql', {
      name: `${config.prefix}-SNS-${config.name}-Event-Rule-DLQ`,
      tags: config.tags,
    });

    this.createEventRules();
    this.createPolicyForEventBridgeToSns();

    if (config.snsAlarmTopic) {
      //get alerted if we get 10 messages in DLQ in 4 evaluation period of 5 minutes
      createDeadLetterQueueAlarm(
        this,
        config.snsAlarmTopic,
        this.snsTopicDlq.name,
        `${config.name}-Rule-dlq-alarm`,
        true,
        4,
        300,
        10,
      );
    }
  }

  /**
   * Rolls out event bridge rule and attaches them to sns target
   * @private
   */
  private createEventRules() {
    const eventRuleProps: PocketEventBridgeProps = {
      eventRule: {
        name: `${this.config.prefix}-${this.config.name}-Rule`,
        eventPattern: this.config.eventPattern,
        eventBusName: this.config.eventBusName,
        preventDestroy: true,
      },
      // we need to remove targets before we can remove the rules
      targets: [
        /* {
          arn: this.snsTopic.arn,
          deadLetterArn: this.snsTopicDlq.arn,
          targetId: `${this.config.prefix}-Collection-Event-SNS-Target`,
          terraformResource: this.snsTopic,
        }, */
      ],
    };
    return new PocketEventBridgeRuleWithMultipleTargets(
      this,
      `${this.config.prefix}-${this.config.name}-EventBridge-Rule`,
      eventRuleProps,
    );
  }

  private createPolicyForEventBridgeToSns() {
    const eventBridgeSnsPolicy =
      new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        `${config.prefix}-${config.name}-EventBridge-SNS-Policy`,
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

    return new snsTopicPolicy.SnsTopicPolicy(this, 'events-sns-topic-policy', {
      arn: this.snsTopic.arn,
      policy: eventBridgeSnsPolicy,
    });
  }
}
