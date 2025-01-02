import { Construct } from 'constructs';
import {
  PocketEventBridgeProps,
  PocketEventBridgeRuleWithMultipleTargets,
  ApplicationEventBus,
  PocketEventBridgeTargets,
} from '@pocket-tools/terraform-modules';
import { config } from '../../config/index.ts';
import {
  dataAwsSqsQueue,
  snsTopic,
  dataAwsIamPolicyDocument,
  snsTopicPolicy,
  sqsQueuePolicy,
  dataAwsSnsTopic,
} from '@cdktf/provider-aws';
import { resource } from '@cdktf/provider-null';
import { eventConfig } from './eventConfig.ts';
import { createDeadLetterQueueAlarm } from '../utils.ts';

/**
 * Purposes:
 *
 * 1. Set up a rule set to send ML-generated prospects to two
 * separate systems (prospect-generation event):
 *
 *    a. A pre-existing production SQS queue that is consumed by a lambda which
 *       feeds those prospects to the curation admin tool.
 *
 *    b. The dev instance of this event bridge, which will in turn send the
 *       prospects to the dev SQS queue to be consumed by the dev lambda and sent
 *       to the dev curation admin tool :D
 *
 * 2. Set up the SNS topic and Event Bridge rules for all of the other Prospect events. (prospect-dismiss event as of now)
 *
 * Note that this class behaves differently based on the environment to which
 * it was deployed!
 */
export class ProspectEvents extends Construct {
  public readonly snsTopic: snsTopic.SnsTopic;
  public readonly sqs: dataAwsSqsQueue.DataAwsSqsQueue;
  public readonly sqsDlq: dataAwsSqsQueue.DataAwsSqsQueue;

  readonly sqsIdForProspectGenerationEvent = `prospect-${config.environment}-queue`;
  readonly sqsNameForProspectGenerationEvent = `ProspectAPI-${config.environment}-Sqs-Translation-Queue`;

  readonly dlqIdForProspectEvents = `prospect-${config.environment}-dlq`;
  readonly dlqNameForProspectEvents = `ProspectAPI-${config.environment}-Sqs-Translation-Queue-Deadletter`;

  readonly snsIdForProspectEvents = `prospect-event-topic`;
  readonly snsNameForProspectEvents = `${config.prefix}-ProspectEventTopic`;

  constructor(
    scope: Construct,
    private name: string,
    private sharedEventBus: ApplicationEventBus,
    private snsAlarmTopic: dataAwsSnsTopic.DataAwsSnsTopic,
  ) {
    super(scope, name);

    // pre-existing queues (prod and dev) created by prospect-api
    this.sqs = this.createSqsForProspectEvents(
      this.sqsIdForProspectGenerationEvent,
      this.sqsNameForProspectGenerationEvent,
    );

    // create a dlq for all Prospect events
    this.sqsDlq = this.createSqsForProspectEvents(
      this.dlqIdForProspectEvents,
      this.dlqNameForProspectEvents,
    );

    // create an SNS topic for all Prospect events except for prospect-generation
    this.snsTopic = this.createSnsForProspectEvents();

    this.createProspectGenerationEventRule();
    this.createPolicyForEventBridgeToSqs();

    // setting up prospect-dismiss event rule
    const prospectEventDismissRule = this.createProspectEventRule(
      'Prospect-Dismiss',
      eventConfig.prospectDismiss.source,
      eventConfig.prospectDismiss.detailType,
    );
    // setting up the required IAM policies
    this.createPolicyForEventBridgeToSns();

    // TODO: create a policy function for dev event bridge
    // this.createPolicyForEventBridgeToDevEventBridge();

    //todo: disabling till this ticket is done:
    //https://getpocket.atlassian.net/browse/INFRA-1048
    //prospect-alert triggering false alert for 1 message in the DLQ
    createDeadLetterQueueAlarm(
      this,
      snsAlarmTopic,
      this.sqsDlq.name,
      `${eventConfig.name}-Rule-DLQ-Alarm`,
      false, // temporarily disabled, see note above
    );

    new resource.Resource(this, 'null-resource', {
      dependsOn: [
        prospectEventDismissRule.getEventBridge().rule,
        this.snsTopic,
      ],
    });
  }

  /**
   * Creates a SQS/DLQ.
   * NOTE: The SQS will only be used by the prospect-generation events. The DLQ is shared and used by other Prospect events as well.
   *
   * @param id
   * @param name
   * @returns A queue (SQS/DLQ).
   */
  private createSqsForProspectEvents(
    id: string,
    name: string,
  ): dataAwsSqsQueue.DataAwsSqsQueue {
    return new dataAwsSqsQueue.DataAwsSqsQueue(this, id, {
      name,
    });
  }

  /**
   * Creates the SNS topic that all Prospect events will publish to except for prospect-generation event.
   *
   * @param id default set to class variable: snsIdForProspectEvents. Shouldn't need to change it unless changing it for all prospect events that use this sns topic.
   * @param name default set to class variable: snsNameForProspectEvents. Shouldn't need to change it unless changing it for all prospect events that use this sns topic.
   * @returns A SNS topic that is used by all Prospect events except for prospect-generation events.
   */
  private createSnsForProspectEvents(
    id = this.snsIdForProspectEvents,
    name = this.snsNameForProspectEvents,
  ): snsTopic.SnsTopic {
    return new snsTopic.SnsTopic(this, id, {
      name,
      lifecycle: {
        preventDestroy: true,
      },
    });
  }

  /**
   * Creates and sets up the required constructs needed for the prospect-generation event.
   * NOTE: this is an unique event that has its own SQS and is not published to the SNS topic shared by all of the other Prospect events.
   *       Hence, this function does not provide any parameters to customize event and construct attributes.
   */
  private createProspectGenerationEventRule() {
    // both prod and dev have an sqs target
    const targets: PocketEventBridgeTargets[] = [
      {
        arn: this.sqs.arn,
        deadLetterArn: this.sqsDlq.arn,
        targetId: `${config.prefix}-Prospect-Event-SQS-Target`,
      },
    ];

    // only prod also targets the dev event bridge
    if (!config.isDev) {
      // https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-cross-account.html
      // note that permissions have been added by hand to the dev event bus to
      // allow it to receive events from the prod bus.
      targets.push({
        arn: 'arn:aws:events:us-east-1:410318598490:event-bus/PocketEventBridge-Dev-Shared-Event-Bus',
        targetId: `${config.prefix}-Prospect-Event-Dev-Event-Bridget-Target`,
      });
    }

    const prospectGenerationEventRuleProps: PocketEventBridgeProps = {
      eventRule: {
        name: `${config.prefix}-ProspectEvents-Rule`,
        eventPattern: {
          source: [eventConfig.prospectGeneration.source],
          'detail-type': eventConfig.prospectGeneration.detailType,
        },
        eventBusName: this.sharedEventBus.bus.name,
      },
      targets,
    };

    new PocketEventBridgeRuleWithMultipleTargets(
      this,
      `${config.prefix}-Prospect-Prod-EventBridge-Rule`,
      prospectGenerationEventRuleProps,
    );
  }

  /**
   * Create an event bridge rule for Prospect events.
   *
   * @param name
   * @param source
   * @param detailType
   */
  private createProspectEventRule(
    name: string,
    source: string,
    detailType: string[],
  ) {
    const targets: PocketEventBridgeTargets[] = [
      {
        arn: this.snsTopic.arn,
        deadLetterArn: this.sqsDlq.arn, //using the same DLQ for all prospect events (prospect-generation and prospect-dismiss as of now)
        targetId: `${config.prefix}-Prospect-Event-SNS-Target`,
        terraformResource: this.snsTopic,
      },
    ];

    const prospectEventRuleProps = {
      eventRule: {
        name: `${config.prefix}-${name}-Event-Rule`,
        eventPattern: {
          source: [source],
          'detail-type': detailType,
        },
        eventBusName: this.sharedEventBus.bus.name,
        preventDestroy: true,
      },
      targets,
    };

    return new PocketEventBridgeRuleWithMultipleTargets(
      this,
      `${config.prefix}-${name}-Prod-EventBridge-Rule`,
      prospectEventRuleProps,
    );
  }

  /**
   * Create IAM policy to allow EventBridge to publish to the SNS topic.
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
      'prospect-events-sns-topic-policy',
      {
        arn: this.snsTopic.arn,
        policy: eventBridgeSnsPolicy,
      },
    );
  }

  /**
   * Create IAM policy to allow EventBridge to send messages to SQS for prospect-generation events.
   */
  private createPolicyForEventBridgeToSqs() {
    const eventBridgeSqsPolicy =
      new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        `${config.prefix}-EventBridge-Prospect-Event-SQS-Policy`,
        {
          statement: [
            {
              effect: 'Allow',
              actions: ['sqs:SendMessage'],
              resources: [this.sqs.arn],
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

    new sqsQueuePolicy.SqsQueuePolicy(this, 'prospect-events-sqs-policy', {
      policy: eventBridgeSqsPolicy,
      queueUrl: this.sqs.url,
    });
  }
}
