import { Construct } from 'constructs';
import { App, TerraformStack } from 'cdktf';
import { provider as awsProvider, wafv2WebAcl } from '@cdktf/provider-aws';
import { PocketALBApplication } from './pocket/PocketALBApplication.ts';
import { ApplicationECSContainerDefinitionProps } from './base/ApplicationECSContainerDefinition.ts';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import { provider as timeProvider } from '@cdktf/provider-time';
import { PocketAwsSyntheticChecks } from './pocket/PocketCloudwatchSynthetics.ts';
import { PocketVPC } from './pocket/PocketVPC.ts';

class Example extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
    });
    new localProvider.LocalProvider(this, 'local', {});
    new nullProvider.NullProvider(this, 'null', {});
    new timeProvider.TimeProvider(this, 'timeProvider', {});

    const pocketVpc = new PocketVPC(this, 'pocket-vpc');

    const containerConfigBlue: ApplicationECSContainerDefinitionProps = {
      name: 'blueContainer',
      containerImage: 'n0coast/node-example',
      repositoryCredentialsParam:
        'arn:aws:secretsmanager:us-east-1:410318598490:secret:Shared/DockerHub-79jJxy',
      portMappings: [
        {
          hostPort: 3000,
          containerPort: 3000,
        },
      ],
      envVars: [
        {
          name: 'foo',
          value: 'bar',
        },
      ],
      mountPoints: [
        {
          containerPath: '/qdrant/storage',
          sourceVolume: 'data',
        },
      ],
      logMultilinePattern: '^\\S.+',
      logDatetimeFormat: '[%b %d, %Y %H:%M:%S]',
      // logGroup: '/platform/blueContainer/ecs', use logGroup OR logDatetimeFormat
      logStreamPrefix: 'blueContainer',
      ulimits: [
        {
          hardLimit: 65535,
          name: 'nofile',
          softLimit: 65535,
        },
      ],
    };

    const wafAcl = new wafv2WebAcl.Wafv2WebAcl(this, 'example_waf_acl', {
      description: 'Example Pocket Waf ACL',
      name: 'pocket-example-waf',
      scope: 'REGIONAL',
      defaultAction: {
        allow: {},
      },
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: 'pocket-example-waf-default-rule',
        sampledRequestsEnabled: true,
      },
      rule: [
        {
          name: 'ExampleRateBasedPolicy',
          priority: 1,
          action: {
            block: {},
          },
          statement: {
            rateBasedStatement: {
              limit: 10000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'pocket-example-waf-rate-limit',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    new PocketALBApplication(this, 'example', {
      accessLogs: {
        bucket: 'pocket-dev-blah',
      },
      alb6CharacterPrefix: 'ACMECO',
      cdn: false, // maybe make this false if you're testing an actual terraform apply - cdn's take a loooong time to spin up
      codeDeploy: {
        useCodeDeploy: true,
      },
      containerConfigs: [containerConfigBlue],
      domain: 'acme.getpocket.dev',
      ecsIamConfig: {
        prefix: 'ACME-Dev',
        taskExecutionRolePolicyStatements: [
          {
            effect: 'Allow',
            actions: [
              'secretsmanager:GetResourcePolicy',
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
              'secretsmanager:ListSecretVersionIds',
            ],
            resources: [
              'arn:aws:secretsmanager:us-east-1:410318598490:secret:Shared/DockerHub-79jJxy',
            ],
          },
        ],
        taskRolePolicyStatements: [],
        taskExecutionDefaultAttachmentArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      efsConfig: {
        creationToken: 'ACME-Dev',
        volumeName: 'data',
      },
      exposedContainer: {
        name: 'blueContainer',
        port: 3000,
        healthCheckPath: '/',
      },
      internal: false,
      prefix: 'ACME-Dev', // Prefix is a combo of the `Name-Environment`
      wafConfig: {
        aclArn: wafAcl.arn,
      },
    });

    new PocketAwsSyntheticChecks(this, 'synthetics', {
      environment: 'Dev',
      prefix: 'ACME-Dev',
      query: [
        {
          endpoint: 'acme.getpocket.dev',
          data: '{"query": "query { someGraphQlQuery(arg1: \\"1\\", arg2: \\"1\\") {returnedAttr} }"}',
          jmespath: 'errors[0].message', // errors checks can confirm GraphQL is working as desired, though preferably these are positive checks
          response:
            'Error - Not Found: A resource by that arg1 could not be found',
        },
      ],
      securityGroupIds: pocketVpc.defaultSecurityGroups.ids,
      shortName: 'ACME',
      subnetIds: pocketVpc.privateSubnetIds,
      uptime: [
        {
          response: 'ok',
          url: `acme.getpocket.dev/.well-known/apollo/server-health`,
        },
      ],
    });
  }
}

const app = new App();
new Example(app, 'acme-example');
app.synth();
