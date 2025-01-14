import { TerraformMetaArguments } from 'cdktf';
import {
  appautoscalingPolicy,
  appautoscalingTarget,
  cloudwatchMetricAlarm,
} from '@cdktf/provider-aws';
import { Construct } from 'constructs';

interface ApplicationAutoscalingPropsBase extends TerraformMetaArguments {
  ecsClusterName: string;
  ecsServiceName: string;
  prefix: string;
  scalableDimension: string;
  scaleInThreshold: number;
  scaleOutThreshold: number;
  tags?: { [key: string]: string };
  targetMaxCapacity: number;
  targetMinCapacity: number;
}

interface ApplicationAutoscalingOut extends ApplicationAutoscalingPropsBase {
  stepScaleOutAdjustment: number;
}

interface ApplicationAutoscalingIn extends ApplicationAutoscalingPropsBase {
  stepScaleInAdjustment: number;
}

export type ApplicationAutoscalingProps =
  | ApplicationAutoscalingOut
  | ApplicationAutoscalingIn;

/*
 * Generates an AutoScaling group
 */

export class ApplicationAutoscaling extends Construct {
  constructor(
    scope: Construct,
    name: string,
    config: ApplicationAutoscalingProps,
  ) {
    super(scope, name);

    // set up autoscaling target & in/out policies
    const autoScalingTarget = ApplicationAutoscaling.generateAutoScalingTarget(
      this,
      config,
    );

    const applicationScaleOut =
      ApplicationAutoscaling.generateAutoSclaingPolicy(
        this,
        config,
        autoScalingTarget,
        'Out',
      );

    const applicationScaleIn = ApplicationAutoscaling.generateAutoSclaingPolicy(
      this,
      config,
      autoScalingTarget,
      'In',
    );

    // set up cloudwatch alarms
    ApplicationAutoscaling.generateCloudwatchMetricAlarm(
      this,
      config,
      'scale_out_alarm',
      `${config.prefix} Service High CPU`,
      'Alarm to add capacity if container CPU is high',
      'GreaterThanThreshold',
      config.scaleOutThreshold,
      applicationScaleOut.arn,
    );

    ApplicationAutoscaling.generateCloudwatchMetricAlarm(
      this,
      config,
      'scale_in_alarm',
      `${config.prefix} Service Low CPU`,
      'Alarm to reduce capacity if container CPU is low',
      'LessThanThreshold',
      config.scaleInThreshold,
      applicationScaleIn.arn,
    );
  }

  /**
   * Creates an Auto Scaling Target
   * @param resource
   * @param config
   * @returns appautoscalingTarget.AppautoscalingTarget
   */
  static generateAutoScalingTarget(
    scope: Construct,
    config: ApplicationAutoscalingProps,
  ): appautoscalingTarget.AppautoscalingTarget {
    return new appautoscalingTarget.AppautoscalingTarget(
      scope,
      `autoscaling_target`,
      {
        maxCapacity: config.targetMaxCapacity,
        minCapacity: config.targetMinCapacity,
        resourceId: `service/${config.ecsClusterName}/${config.ecsServiceName}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
        provider: config.provider,
      },
    );
  }

  /**
   * Creates an Autoscaling Policy
   * @param resource
   * @param config
   * @param target
   * @param type
   * @returns appautoscalingPolicy.AppautoscalingPolicy
   */
  static generateAutoSclaingPolicy(
    scope: Construct,
    config: ApplicationAutoscalingProps,
    target: appautoscalingTarget.AppautoscalingTarget,
    type: 'In' | 'Out',
  ): appautoscalingPolicy.AppautoscalingPolicy {
    let stepAdjustment: appautoscalingPolicy.AppautoscalingPolicyStepScalingPolicyConfigurationStepAdjustment[];

    if (type === 'In' && 'stepScaleInAdjustment' in config) {
      stepAdjustment = [
        {
          metricIntervalUpperBound: '0',
          scalingAdjustment: config.stepScaleInAdjustment,
        },
      ];
    } else if (type === 'Out' && 'stepScaleOutAdjustment' in config) {
      stepAdjustment = [
        {
          metricIntervalLowerBound: '0',
          scalingAdjustment: config.stepScaleOutAdjustment,
        },
      ];
    } else {
      throw new Error('Step scaling adjustment is required');
    }

    const appAutoscaling = new appautoscalingPolicy.AppautoscalingPolicy(
      scope,
      `scale_${type.toLowerCase()}_policy`,
      {
        name: `${config.prefix}-Scale${type}Policy`,
        policyType: 'StepScaling',
        resourceId: target.resourceId,
        scalableDimension: target.scalableDimension,
        serviceNamespace: target.serviceNamespace,

        stepScalingPolicyConfiguration: {
          adjustmentType: `ChangeInCapacity`,
          cooldown: 60,
          metricAggregationType: 'Average',
          stepAdjustment,
        },
        dependsOn: [target],
        provider: config.provider,
      },
    );

    // Terraform CDK 0.8.1 started outputing this as a {} in syntiesized output and
    // terraform does not like this being an empty object, but it is ok with a null
    appAutoscaling.addOverride(
      'target_tracking_scaling_policy_configuration',
      null,
    );

    return appAutoscaling;
  }

  /**
   * Creates a Cloudwatch Metric Alarm
   * @param resource
   * @param config
   * @param id
   * @param name
   * @param desc
   * @param operator
   * @param threshold
   * @param arn
   */
  static generateCloudwatchMetricAlarm(
    scope: Construct,
    config: ApplicationAutoscalingProps,
    id: string,
    name: string,
    desc: string,
    operator: string,
    threshold: number,
    arn: string,
  ): void {
    new cloudwatchMetricAlarm.CloudwatchMetricAlarm(scope, id, {
      alarmName: name,
      alarmDescription: desc,
      comparisonOperator: operator,
      evaluationPeriods: 2,
      threshold,
      statistic: 'Average',
      period: 60,
      namespace: 'AWS/ECS',
      metricName: 'CPUUtilization',
      treatMissingData: 'notBreaching',
      dimensions: {
        ClusterName: config.ecsClusterName,
        ServiceName: config.ecsServiceName,
      },
      alarmActions: [arn],
      tags: config.tags,
      provider: config.provider,
    });
  }
}
