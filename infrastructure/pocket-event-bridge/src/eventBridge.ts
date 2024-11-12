import { Construct } from 'constructs';
import { PocketEventType } from '@pocket-tools/event-bridge';
import {
  PocketEventBridgeProps,
  PocketEventBridgeRuleWithMultipleTargets,
} from '@pocket-tools/terraform-modules';
import { snsTopic, sqsQueue } from '@cdktf/provider-aws';

export interface PocketEventToTopicProps {
  eventBusName: string;
  prefix: string;
  name: string;
  tags: { [key: string]: string };
  eventPattern: { 'detail-type': PocketEventType[]; source: string };
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
      name: `${config.prefix}-EventsTopic`,
      lifecycle: {
        preventDestroy: true,
      },
    });

    this.snsTopicDlq = new sqsQueue.SqsQueue(this, 'sns-topic-dql', {
      name: `${config.prefix}-SNS-${config.name}-Event-Rule-DLQ`,
      tags: config.tags,
    });
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
      targets: [
        {
          arn: this.snsTopic.arn,
          deadLetterArn: this.snsTopicDlq.arn,
          targetId: `${this.config.prefix}-Collection-Event-SNS-Target`,
          terraformResource: this.snsTopic,
        },
      ],
    };
    return new PocketEventBridgeRuleWithMultipleTargets(
      this,
      `${this.config.prefix}-${this.config.name}-EventBridge-Rule`,
      eventRuleProps,
    );
  }
}
