import { TerraformStack, Testing } from 'cdktf';
import {
  PocketECSApplication,
  PocketECSApplicationProps,
} from './PocketECSApplication.js';

describe('PocketECSApplication', () => {
  let BASE_CONFIG: PocketECSApplicationProps;

  beforeEach(() => {
    BASE_CONFIG = {
      prefix: 'testapp',
      containerConfigs: [],
      ecsIamConfig: {
        prefix: 'testapp-',
        taskExecutionDefaultAttachmentArn: '',
        taskExecutionRolePolicyStatements: [],
        taskRolePolicyStatements: [],
      },
    };
  });

  it('renders an application with minimal config', () => {
    const synthed = Testing.synthScope((stack) => {
      new PocketECSApplication(stack, 'testPocketApp', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an application with custom task sizes', () => {
    const synthed = Testing.synthScope((stack) => {
      BASE_CONFIG.taskSize = {
        cpu: 8675,
        memory: 309,
      };

      new PocketECSApplication(stack, 'testPocketApp', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an application with autoscaling group and tags', () => {
    const synthed = Testing.synthScope((stack) => {
      BASE_CONFIG.tags = {
        name: 'thedude',
        hobby: 'bowling',
      };

      BASE_CONFIG.autoscalingConfig = {
        targetMinCapacity: 1,
        targetMaxCapacity: 2,
        stepScaleInAdjustment: -1,
        stepScaleOutAdjustment: 2,
        scaleInThreshold: 30,
        scaleOutThreshold: 45,
      };

      new PocketECSApplication(stack, 'testPocketApp', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an application with default autoscaling group and tags', () => {
    const synthed = Testing.synthScope((stack) => {
      BASE_CONFIG.tags = {
        name: 'thedude',
        hobby: 'bowling',
      };

      new PocketECSApplication(stack, 'testPocketApp', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an application with modified container def protocol, cpu and memory reservation', () => {
    const synthed = Testing.synthScope((stack) => {
      BASE_CONFIG.containerConfigs = [
        {
          name: 'xray-daemon',
          portMappings: [
            {
              hostPort: 0,
              containerPort: 2000,
              protocol: 'udp',
            },
          ],
          cpu: 10,
          memoryReservation: 50,
        },
      ];

      new PocketECSApplication(stack, 'testPocketApp', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('validates custom alarms config', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'test');

    const alarmConfig = {
      ...BASE_CONFIG,
      alarms: {
        alarms: [
          {
            alarmName: `Test-Alarm-Custom`,
            namespace: 'TM/Alarm',
            metricName: 'Custom',
            dimensions: { Test: 'Alarm' },
            period: 300,
            statistic: 'Sum',
            comparisonOperator: 'GreaterThanThreshold',
            threshold: 500,
            evaluationPeriods: 1,
            datapointsToAlarm: 2,
          },
        ],
      },
    };

    expect(
      () => new PocketECSApplication(stack, 'testPocketApp', alarmConfig),
    ).toThrow(Error);
  });

  it('renders an Pocket App with logs and dashboard in a specified region', () => {
    const synthed = Testing.synthScope((stack) => {
      new PocketECSApplication(stack, 'testPocketApp', {
        ...BASE_CONFIG,
        region: 'central region',
      });
    });
    expect(synthed).toMatchSnapshot();
  });
});
