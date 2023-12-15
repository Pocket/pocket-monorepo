import { TerraformMetaArguments } from 'cdktf';
import { AppautoscalingPolicy } from '@cdktf/provider-aws/lib/appautoscaling-policy';
import { AppautoscalingTarget } from '@cdktf/provider-aws/lib/appautoscaling-target';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { Construct } from 'constructs';

export interface ApplicationAutoscalingProps extends TerraformMetaArguments {
  ecsClusterName: string;
  ecsServiceName: string;
  prefix: string;
  scalableDimension: string;
  scaleInThreshold: number;
  scaleOutThreshold: number;
  stepScaleInAdjustment: number;
  stepScaleOutAdjustment: number;
  tags?: { [key: string]: string };
  targetMaxCapacity: number;
  targetMinCapacity: number;
}

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
   * @returns AppautoscalingTarget
   */
  static generateAutoScalingTarget(
    scope: Construct,
    config: ApplicationAutoscalingProps,
  ): AppautoscalingTarget {
    return new AppautoscalingTarget(scope, `autoscaling_target`, {
      maxCapacity: config.targetMaxCapacity,
      minCapacity: config.targetMinCapacity,
      resourceId: `service/${config.ecsClusterName}/${config.ecsServiceName}`,
      scalableDimension: 'ecs:service:DesiredCount',
      serviceNamespace: 'ecs',
      provider: config.provider,
    });
  }

  /**
   * Creates an Autoscaling Policy
   * @param resource
   * @param config
   * @param target
   * @param type
   * @returns AppautoscalingPolicy
   */
  static generateAutoSclaingPolicy(
    scope: Construct,
    config: ApplicationAutoscalingProps,
    target: AppautoscalingTarget,
    type: 'In' | 'Out',
  ): AppautoscalingPolicy {
    let stepAdjustment;

    if (type === 'In') {
      stepAdjustment = [
        {
          metricIntervalUpperBound: '0',
          scalingAdjustment: config.stepScaleInAdjustment,
        },
      ];
    } else {
      stepAdjustment = [
        {
          metricIntervalLowerBound: '0',
          scalingAdjustment: config.stepScaleOutAdjustment,
        },
      ];
    }

    const appAutoscaling = new AppautoscalingPolicy(
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
    new CloudwatchMetricAlarm(scope, id, {
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
