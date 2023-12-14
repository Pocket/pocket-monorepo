import { Testing } from 'cdktf';
import {
  ApplicationECSService,
  ApplicationECSServiceProps,
} from './ApplicationECSService';

let BASE_CONFIG: ApplicationECSServiceProps;

const testAlbConfig: ApplicationECSServiceProps['albConfig'] = {
  healthCheckPath: '/health',
  listenerArn: 'listen-to-me',
  containerPort: 3000,
  containerName: 'runme',
  albSecurityGroupId: 'strike',
};

describe('ApplicationECSService', () => {
  beforeEach(() => {
    BASE_CONFIG = {
      ecsClusterName: 'cluster-name',
      shortName: 'short',
      useCodeDeploy: false,
      prefix: 'abides-dev',
      ecsClusterArn: 'gorp',
      vpcId: 'myhouse',
      containerConfigs: [],
      privateSubnetIds: ['1.1.1.1', '2.2.2.2'],
      ecsIamConfig: {
        prefix: 'abides-',
        taskExecutionDefaultAttachmentArn: 'someArn',
        taskExecutionRolePolicyStatements: [],
        taskRolePolicyStatements: [],
      },
    };
  });

  it('renders an ECS service with minimal config', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSService(stack, 'testECSService', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an ECS service with full container definition props', () => {
    BASE_CONFIG.launchType = 'ROCKET';
    BASE_CONFIG.deploymentMaximumPercent = 400;
    BASE_CONFIG.deploymentMinimumHealthyPercent = 80;
    BASE_CONFIG.desiredCount = 4;
    BASE_CONFIG.lifecycleIgnoreChanges = ['bowling', 'donnie', 'autobahn'];
    BASE_CONFIG.containerConfigs = [
      {
        portMappings: [
          {
            containerPort: 3002,
            hostPort: 3001,
          },
        ],
        logGroup: 'test/log/group',
        containerImage: 'beverage-here/0.1',
        name: 'lebowski',
        repositoryCredentialsParam: 'someArn',
        envVars: [
          {
            name: 'rug',
            value: 'tiedtheroomtogether',
          },
        ],
        secretEnvVars: [
          {
            name: 'donnie',
            valueFrom: 'throwinrockstonight',
          },
        ],
      },
    ];
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSService(stack, 'testECSService', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an ECS service without a log group container definition props', () => {
    BASE_CONFIG.launchType = 'ROCKET';
    BASE_CONFIG.deploymentMaximumPercent = 400;
    BASE_CONFIG.deploymentMinimumHealthyPercent = 80;
    BASE_CONFIG.desiredCount = 4;
    BASE_CONFIG.lifecycleIgnoreChanges = ['bowling', 'donnie', 'autobahn'];
    BASE_CONFIG.containerConfigs = [
      {
        portMappings: [
          {
            containerPort: 3002,
            hostPort: 3001,
          },
        ],
        containerImage: 'beverage-here/0.1',
        name: 'lebowski',
        repositoryCredentialsParam: 'someArn',
        envVars: [
          {
            name: 'rug',
            value: 'tiedtheroomtogether',
          },
        ],
        secretEnvVars: [
          {
            name: 'donnie',
            valueFrom: 'throwinrockstonight',
          },
        ],
      },
    ];

    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSService(stack, 'testECSService', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an ECS service without an image container definition props', () => {
    BASE_CONFIG.launchType = 'ROCKET';
    BASE_CONFIG.deploymentMaximumPercent = 400;
    BASE_CONFIG.deploymentMinimumHealthyPercent = 80;
    BASE_CONFIG.desiredCount = 4;
    BASE_CONFIG.lifecycleIgnoreChanges = ['bowling', 'donnie', 'autobahn'];
    BASE_CONFIG.containerConfigs = [
      {
        portMappings: [
          {
            containerPort: 3002,
            hostPort: 3001,
          },
        ],
        logGroup: 'test/log/group',
        name: 'lebowski',
        repositoryCredentialsParam: 'someArn',
        envVars: [
          {
            name: 'rug',
            value: 'tiedtheroomtogether',
          },
        ],
        secretEnvVars: [
          {
            name: 'donnie',
            valueFrom: 'throwinrockstonight',
          },
        ],
      },
    ];

    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSService(stack, 'testECSService', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an ECS service with full container definition props and ALB security group config', () => {
    BASE_CONFIG.containerConfigs = [
      {
        portMappings: [
          {
            containerPort: 3002,
            hostPort: 3001,
          },
        ],
        logGroup: 'test/log/group',
        containerImage: 'beverage-here/0.1',
        name: 'lebowski',
        repositoryCredentialsParam: 'someArn',
        envVars: [
          {
            name: 'rug',
            value: 'tiedtheroomtogether',
          },
        ],
        secretEnvVars: [
          {
            name: 'donnie',
            valueFrom: 'throwinrockstonight',
          },
        ],
      },
    ];

    BASE_CONFIG.albConfig = testAlbConfig;

    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSService(stack, 'testECSService', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an ECS service with mountPoints deduplicated in the task definition', () => {
    BASE_CONFIG.launchType = 'ROCKET';
    BASE_CONFIG.containerConfigs = [
      {
        name: 'container1',
      },
      {
        name: 'container2',
        mountPoints: [
          {
            sourceVolume: 'src1',
            containerPath: '/src1',
          },
          {
            sourceVolume: 'src2',
            containerPath: '/src2',
          },
        ],
      },
      {
        name: 'container3',
        mountPoints: [
          {
            sourceVolume: 'src1',
            containerPath: '/src1',
            readOnly: true,
          },
          {
            sourceVolume: 'src3',
            containerPath: '/src3',
          },
        ],
      },
    ];

    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSService(stack, 'testECSService', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an ECS service with code deploy', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSService(stack, 'testECSService', {
        ...BASE_CONFIG,
        ...testAlbConfig,
        useCodeDeploy: true,
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an ECS service with code deploy notifications set for failed only', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSService(stack, 'testECSService', {
        ...BASE_CONFIG,
        ...testAlbConfig,
        useCodeDeploy: true,
        codeDeployNotifications: {
          notifyOnFailed: true,
          notifyOnStarted: false,
          notifyOnSucceeded: false,
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an ECS service with code deploy and excludes the code deployment command resource when useCodePipeline is true', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSService(stack, 'testECSService', {
        ...BASE_CONFIG,
        ...testAlbConfig,
        useCodeDeploy: true,
        useCodePipeline: true,
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('exposes ECR repos and task definition as public fields', () => {
    BASE_CONFIG.containerConfigs = [
      {
        portMappings: [
          {
            containerPort: 3002,
            hostPort: 3001,
          },
        ],
        name: 'lebowski',
      },
    ];

    Testing.synthScope((stack) => {
      const applicationECSService = new ApplicationECSService(
        stack,
        'testECSService',
        BASE_CONFIG,
      );

      expect(applicationECSService.ecrRepos.length).toEqual(1);
      expect(
        applicationECSService.taskDefinition.terraformResourceType,
      ).toEqual('aws_ecs_task_definition');
    });
  });

  it('attaches persistent (efs) storage to a ECS task', () => {
    BASE_CONFIG.containerConfigs = [
      {
        mountPoints: [
          {
            containerPath: '/someMountPoint',
            sourceVolume: 'sourceVolume',
          },
        ],
        name: 'lebowski',
      },
    ];
    BASE_CONFIG.efsConfig = {
      efs: { arn: 'fakeArn', id: 'someId' },
      volumeName: 'sourceVolume',
    };

    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSService(stack, 'testECSService', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });
});
