import { TerraformMetaArguments, TerraformResource } from 'cdktf';
import { Construct } from 'constructs';
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import {
  CloudwatchEventTarget,
  CloudwatchEventTargetConfig,
} from '@cdktf/provider-aws/lib/cloudwatch-event-target';

export type Target = {
  arn: string;
  deadLetterArn?: string;
  targetId?: string;
  // an event bridge rule may have a target that already exists. in this case,
  // we don't need a dependsOn value.
  dependsOn?: TerraformResource;
};

export interface ApplicationEventBridgeRuleProps
  extends TerraformMetaArguments {
  name: string;
  description?: string;
  eventBusName?: string;
  /**
   * (Optional) The event pattern described a JSON object.
   * At least one of `schedule_expression` or `event_pattern` is required. */
  eventPattern?: { [key: string]: any };
  /**
   * (Optional) The scheduling expression.
   * For example, cron(0 20 * * ? *) or rate(5 minutes).
   * At least one of `schedule_expression` or `event_pattern` is required.
   * Only available on the default event bus. */
  scheduleExpression?: string;
  targets?: Target[];
  tags?: { [key: string]: string };
  preventDestroy?: boolean;
}

export class ApplicationEventBridgeRule extends Construct {
  public readonly rule: CloudwatchEventRule;

  constructor(
    scope: Construct,
    name: string,
    private config: ApplicationEventBridgeRuleProps,
  ) {
    super(scope, name);

    this.rule = this.createCloudwatchEventRule();
  }

  private createCloudwatchEventRule() {
    if (this.config.targets?.length > 5) {
      throw new Error('AWS allows only up to 5 targets per event bridge rule');
    }
    const eventBus = this.config.eventBusName ?? 'default';
    const { scheduleExpression, eventPattern } = this.config;
    const rule = new CloudwatchEventRule(this, 'event-bridge-rule', {
      name: `${this.config.name}-Rule`,
      description: this.config.description,
      eventPattern: eventPattern ? JSON.stringify(eventPattern) : undefined,
      scheduleExpression,
      eventBusName: eventBus,
      lifecycle: {
        preventDestroy: this.config.preventDestroy,
      },
      tags: this.config.tags,
      provider: this.config.provider,
    });

    if (this.config.targets) {
      this.config.targets.forEach((t) => {
        // this is semi-terrible.
        //
        // the CloudwatchEventTargetConfig type will not allow us to add the
        // `dependsOn` property after object creation (due to it being
        // readonly). so we create a generic object, optionally add the
        // `dependsOn` property, then later cast it as the required
        // CloudwatchEventTargetConfig type.
        const eventTargetConfig: { [key: string]: any } = {
          rule: rule.name,
          targetId: t.targetId,
          arn: t.arn,
          deadLetterConfig: t.deadLetterArn ? { arn: t.deadLetterArn } : {},
          eventBusName: eventBus,
          provider: this.config.provider,
        };

        if (t.dependsOn) {
          eventTargetConfig.dependsOn = [t.dependsOn, rule];
        }

        new CloudwatchEventTarget(
          this,
          `event-bridge-target-${t.targetId}`,
          // yuck!
          eventTargetConfig as CloudwatchEventTargetConfig,
        );
      });
    }

    return rule;
  }
}
