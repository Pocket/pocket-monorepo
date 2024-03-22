import { Testing } from 'cdktf';
import { TestResource } from '../testHelpers.js';
import {
  ApplicationAutoscaling,
  ApplicationAutoscalingProps,
} from './ApplicationAutoscaling';

describe('ApplicationAutoscaling', () => {
  const props: ApplicationAutoscalingProps = {
    prefix: 'test-',
    targetMinCapacity: 1,
    targetMaxCapacity: 5,
    ecsClusterName: 'ecs-cluster-test',
    ecsServiceName: 'ecs-service-test',
    scalableDimension: 'ecs:service:DesiredCount',
    stepScaleOutAdjustment: 2,
    stepScaleInAdjustment: -1,
    scaleInThreshold: 30,
    scaleOutThreshold: 45,
  };

  describe('generateAutoScalingTarget', () => {
    it('renders an AutoscalingTarget', () => {
      const synthed = Testing.synthScope((stack) => {
        const construct = new TestResource(stack, 'test-resource');

        ApplicationAutoscaling.generateAutoScalingTarget(construct, props);
      });
      expect(synthed).toMatchSnapshot();
    });
  });

  describe('generateAutoScalingPolicy', () => {
    it('renders a scale-in AutoscalingPolicy', () => {
      const synthed = Testing.synthScope((stack) => {
        const construct = new TestResource(stack, 'test-resource');
        const target = ApplicationAutoscaling.generateAutoScalingTarget(
          construct,
          props,
        );
        ApplicationAutoscaling.generateAutoSclaingPolicy(
          construct,
          props,
          target,
          'In',
        );
      });
      expect(synthed).toMatchSnapshot();
    });

    it('renders a scale-out AutoscalingPolicy', () => {
      const synthed = Testing.synthScope((stack) => {
        const construct = new TestResource(stack, 'test-resource');
        const target = ApplicationAutoscaling.generateAutoScalingTarget(
          construct,
          props,
        );
        ApplicationAutoscaling.generateAutoSclaingPolicy(
          construct,
          props,
          target,
          'Out',
        );
      });
      expect(synthed).toMatchSnapshot();
    });
  });

  describe('generatecloudwatchMetricAlarm.CloudwatchMetricAlarm', () => {
    it('renders a scale-in Cloudwatch Alarm', () => {
      const synthed = Testing.synthScope((stack) => {
        const construct = new TestResource(stack, 'test-resource');

        const target = ApplicationAutoscaling.generateAutoScalingTarget(
          construct,
          props,
        );

        const policy = ApplicationAutoscaling.generateAutoSclaingPolicy(
          construct,
          props,
          target,
          'In',
        );

        ApplicationAutoscaling.generateCloudwatchMetricAlarm(
          construct,
          props,
          'scale_in_alarm',
          `${props.prefix} Service Low CPU`,
          'Alarm to reduce capacity if container CPU is low',
          'LessThanThreshold',
          props.scaleInThreshold,
          policy.arn,
        );
      });
      expect(synthed).toMatchSnapshot();
    });

    it('renders a scale-out Cloudwatch Alarm', () => {
      const synthed = Testing.synthScope((stack) => {
        const construct = new TestResource(stack, 'test-resource');

        const target = ApplicationAutoscaling.generateAutoScalingTarget(
          construct,
          props,
        );

        const policy = ApplicationAutoscaling.generateAutoSclaingPolicy(
          construct,
          props,
          target,
          'Out',
        );

        ApplicationAutoscaling.generateCloudwatchMetricAlarm(
          construct,
          props,
          'scale_out_alarm',
          `${props.prefix} Service High CPU`,
          'Alarm to add capacity if container CPU is high',
          'GreaterThanThreshold',
          props.scaleOutThreshold,
          policy.arn,
        );
      });
      expect(synthed).toMatchSnapshot();
    });
  });

  describe('constructor', () => {
    it('renders autoscaling without tags', () => {
      const synthed = Testing.synthScope((stack) => {
        new ApplicationAutoscaling(stack, 'testAutoscaling', props);
      });
      expect(synthed).toMatchSnapshot();
    });
  });
});
