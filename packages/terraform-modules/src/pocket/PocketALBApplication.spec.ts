import { TerraformStack, Testing } from 'cdktf';
import {
  PocketALBApplication,
  PocketALBApplicationProps,
} from './PocketALBApplication.ts';

describe('PocketALBApplication', () => {
  let BASE_CONFIG: PocketALBApplicationProps;

  beforeEach(() => {
    BASE_CONFIG = {
      prefix: 'testapp',
      alb6CharacterPrefix: 'TSTAPP',
      domain: 'testing.bowling.gov',
      containerConfigs: [],
      codeDeploy: {
        useCodeDeploy: false,
        snsNotificationTopicArn: 'notify-me',
      },
      ecsIamConfig: {
        prefix: 'testapp-',
        taskExecutionDefaultAttachmentArn: '',
        taskExecutionRolePolicyStatements: [],
        taskRolePolicyStatements: [],
      },
      exposedContainer: {
        name: 'main_container',
        port: 8675309,
        healthCheckPath: '/test',
      },
    };
  });

  it('renders an application with minimal config', () => {
    const synthed = Testing.synthScope((stack) => {
      new PocketALBApplication(stack, 'testPocketApp', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an external application with a cdn', () => {
    const synthed = Testing.synthScope((stack) => {
      BASE_CONFIG.internal = false;
      BASE_CONFIG.cdn = true;

      new PocketALBApplication(stack, 'testPocketApp', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an external application with a waf', () => {
    const synthed = Testing.synthScope((stack) => {
      BASE_CONFIG.internal = false;
      BASE_CONFIG.cdn = false;
      BASE_CONFIG.wafConfig = { aclArn: 'some-arn' };

      new PocketALBApplication(stack, 'testPocketApp', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an external application without a cdn', () => {
    const synthed = Testing.synthScope((stack) => {
      BASE_CONFIG.internal = false;
      BASE_CONFIG.cdn = false;

      new PocketALBApplication(stack, 'testPocketApp', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an external application with a CDN and a waf', () => {
    const synthed = Testing.synthScope((stack) => {
      BASE_CONFIG.internal = false;
      BASE_CONFIG.cdn = true;
      BASE_CONFIG.wafConfig = { aclArn: 'some-arn' };

      new PocketALBApplication(stack, 'testPocketApp', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an internal application', () => {
    const synthed = Testing.synthScope((stack) => {
      BASE_CONFIG.internal = true;
      BASE_CONFIG.cdn = false;

      new PocketALBApplication(stack, 'testPocketApp', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an application with custom task sizes', () => {
    const synthed = Testing.synthScope((stack) => {
      BASE_CONFIG.taskSize = {
        cpu: 8675,
        memory: 309,
      };

      new PocketALBApplication(stack, 'testPocketApp', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('throws an error trying for an internal app with a cdn', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'test');

    BASE_CONFIG.internal = true;
    BASE_CONFIG.cdn = true;

    expect(() => {
      new PocketALBApplication(stack, 'testPocketApp', BASE_CONFIG);
    }).toThrow('You can not have a cached ALB and have it be internal.');
  });

  it('renders an internal application with tags', () => {
    const synthed = Testing.synthScope((stack) => {
      BASE_CONFIG.internal = true;
      BASE_CONFIG.cdn = false;
      BASE_CONFIG.tags = {
        name: 'thedude',
        hobby: 'bowling',
      };

      new PocketALBApplication(stack, 'testPocketApp', BASE_CONFIG);
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

      new PocketALBApplication(stack, 'testPocketApp', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an application with default autoscaling group and tags', () => {
    const synthed = Testing.synthScope((stack) => {
      BASE_CONFIG.tags = {
        name: 'thedude',
        hobby: 'bowling',
      };

      new PocketALBApplication(stack, 'testPocketApp', BASE_CONFIG);
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

      new PocketALBApplication(stack, 'testPocketApp', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an application alarms', () => {
    const synthed = Testing.synthScope((stack) => {
      const alarmConfig = {
        ...BASE_CONFIG,
        alarms: {
          http5xxError: {
            threshold: 10,
            evaluationPeriods: 1,
            period: 600,
            actions: ['sns-arn-for-5xx-errors'],
          },
          httpLatency: {
            threshold: 0.5,
            evaluationPeriods: 2,
            period: 300,
            actions: ['sns-arn-for-latency'],
          },
          httpRequestCount: {
            threshold: 10000,
            evaluationPeriods: 3,
            period: 900,
            actions: [],
          },
        },
      };

      new PocketALBApplication(stack, 'testPocketApp', alarmConfig);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an application custom default alarms', () => {
    const synthed = Testing.synthScope((stack) => {
      const alarmConfig = {
        ...BASE_CONFIG,
        alarms: {
          customAlarms: [
            {
              alarmName: `Alarm-Custom`,
              namespace: 'TM/Alarm',
              metricName: 'Custom',
              dimensions: { Test: 'Alarm' },
              period: 300,
              statistic: 'Sum',
              comparisonOperator: 'GreaterThanThreshold',
              threshold: 500,
              evaluationPeriods: 1,
            },
          ],
        },
      };

      new PocketALBApplication(stack, 'testPocketApp', alarmConfig);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('validates http 5xx alarm config', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'test');

    const alarmConfig = {
      ...BASE_CONFIG,
      alarms: {
        http5xxErrorPercentage: {
          datapointsToAlarm: 2,
        },
      },
    };

    expect(
      () => new PocketALBApplication(stack, 'testPocketApp', alarmConfig),
    ).toThrow(Error);
  });

  it('validates http latency alarm config', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'test');

    const alarmConfig = {
      ...BASE_CONFIG,
      alarms: {
        httpLatency: {
          datapointsToAlarm: 2,
        },
      },
    };

    expect(
      () => new PocketALBApplication(stack, 'testPocketApp', alarmConfig),
    ).toThrow(Error);
  });

  it('validates custom alarms config', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'test');

    const alarmConfig = {
      ...BASE_CONFIG,
      alarms: {
        customAlarms: [
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
      () => new PocketALBApplication(stack, 'testPocketApp', alarmConfig),
    ).toThrow(Error);
  });

  it('exposes the alb listeners', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'test');

    const pocketApp = new PocketALBApplication(
      stack,
      'testPocketApp',
      BASE_CONFIG,
    );

    expect(pocketApp.listeners.length).toEqual(2);
    // We are using "portInput" here because there is a bug
    // when the "port" attribute is used, it returns a random
    // and really high floating point number
    // Example below:
    // Expected: 80
    // Received: -1.8881545897087505e+289
    expect(pocketApp.listeners[0].portInput).toEqual(80);
    expect(pocketApp.listeners[1].portInput).toEqual(443);
  });

  it('exposes the ecs service', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'test');

    const pocketApp = new PocketALBApplication(
      stack,
      'testPocketApp',
      BASE_CONFIG,
    );

    expect(pocketApp.ecsService.mainTargetGroup).not.toBeNull();
  });

  it('renders an Pocket App with code deploy', () => {
    const synthed = Testing.synthScope((stack) => {
      new PocketALBApplication(stack, 'testPocketApp', {
        ...BASE_CONFIG,
        codeDeploy: {
          useCodeDeploy: true,
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an Pocket App with code deploy notifications set to failed only', () => {
    const synthed = Testing.synthScope((stack) => {
      new PocketALBApplication(stack, 'testPocketApp', {
        ...BASE_CONFIG,
        codeDeploy: {
          useCodeDeploy: true,
          notifications: {
            notifyOnFailed: true,
            notifyOnStarted: false,
            notifyOnSucceeded: false,
          },
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an Pocket App with code deploy and creates appspec.json and taskdef.json when using code pipeline', () => {
    const synthed = Testing.synthScope((stack) => {
      new PocketALBApplication(stack, 'testPocketApp', {
        ...BASE_CONFIG,
        codeDeploy: {
          useCodePipeline: true,
          useCodeDeploy: true,
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an Pocket App with logs and dashboard in a specified region', () => {
    const synthed = Testing.synthScope((stack) => {
      new PocketALBApplication(stack, 'testPocketApp', {
        ...BASE_CONFIG,
        region: 'central region',
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an Pocket App with custom Alarm Description', () => {
    const synthed = Testing.synthScope((stack) => {
      new PocketALBApplication(stack, 'testPocketApp', {
        ...BASE_CONFIG,
        alarms: {
          http5xxErrorPercentage: {
            alarmDescription: 'Uh oh. something bad happened.',
          },
          httpLatency: {
            alarmDescription: 'Uh oh. This is very slow.',
          },
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a Pocket App with attached persistent storage', () => {
    const synthed = Testing.synthScope((stack) => {
      new PocketALBApplication(stack, 'testPocketApp', {
        ...BASE_CONFIG,
        efsConfig: {
          volumeName: 'sourceVolume',
          creationToken: 'someToken',
        },
        containerConfigs: [
          {
            name: 'someMountPoint',
            mountPoints: [
              {
                containerPath: '/qdrant/storage',
                sourceVolume: 'sourceVolume',
              },
            ],
          },
        ],
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a Pocket App with attached waf', () => {
    const synthed = Testing.synthScope((stack) => {
      new PocketALBApplication(stack, 'testPocketApp', {
        ...BASE_CONFIG,
        wafConfig: {
          aclArn: 'justAString',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });
});
