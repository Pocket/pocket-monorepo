import { TerraformMetaArguments, TerraformResource } from 'cdktf';
import { Construct } from 'constructs';
import {
  ApplicationEventBridgeRule,
  ApplicationEventBridgeRuleProps,
  Target,
} from '../base/ApplicationEventBridgeRule.ts';

export type PocketEventBridgeTargets = {
  targetId: string;
  arn: string;
  // when the target is a pre-existing construct, we don't need to pass
  // in a terraform resource.
  terraformResource?: TerraformResource;
  deadLetterArn?: string;
};

export interface PocketEventBridgeProps extends TerraformMetaArguments {
  eventRule: Omit<ApplicationEventBridgeRuleProps, 'targets' | 'tags'>;
  targets?: PocketEventBridgeTargets[];
  tags?: { [key: string]: string };
}

/**
 * class to roll out event bridge rule with multiple AWS resources as targets
 * Note: the targets need to be created prior and passed to this function.
 * This class does not handle IAM, they have to be handled at the consuming function
 */
export class PocketEventBridgeRuleWithMultipleTargets extends Construct {
  private eventBridgeRule: ApplicationEventBridgeRule;
  constructor(
    scope: Construct,
    name: string,
    protected readonly config: PocketEventBridgeProps,
  ) {
    super(scope, name);
    this.eventBridgeRule = this.createEventBridgeRule(config.targets);
  }

  public getEventBridge() {
    return this.eventBridgeRule;
  }

  /**
   * Creates the actual rule for event bridge to trigger the given target.
   * @param eventRuleTargets
   * @private
   */
  private createEventBridgeRule(
    eventRuleTargets?: any,
  ): ApplicationEventBridgeRule {
    const eventRuleConfig = this.config.eventRule;
    const targets: Target[] = [];

    eventRuleTargets.forEach((t) => {
      const target: Target = {
        targetId: t.targetId,
        arn: t.arn,
        deadLetterArn: t.deadLetterArn,
      };

      if (t.terraformResource) {
        target.dependsOn = t.terraformResource;
      }

      targets.push(target);
    });

    return new ApplicationEventBridgeRule(this, 'event-bridge-rule', {
      ...eventRuleConfig,
      targets: targets,
      tags: this.config.tags,
      provider: this.config.provider,
    });
  }
}
