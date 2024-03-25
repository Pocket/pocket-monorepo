import { Construct } from 'constructs';
import {
  App,
  DataTerraformRemoteState,
  S3Backend,
  TerraformStack,
} from 'cdktf';
import { config } from './config';
import {
  ApplicationServerlessRedis,
  PocketALBApplication,
  PocketPagerDuty,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import * as fs from 'fs';

import {
  provider as awsProvider,
  dataAwsRegion,
  dataAwsCallerIdentity,
  dataAwsKmsAlias,
  cloudwatchLogGroup,
  dataAwsSnsTopic,
  dataAwsSubnets,
} from '@cdktf/provider-aws';
import { provider as pagerdutyProvider } from '@cdktf/provider-pagerduty';
import { provider as nullProvider } from '@cdktf/provider-null';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as archiveProvider } from '@cdktf/provider-archive';

class ImageAPI extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new awsProvider.AwsProvider(this, 'aws', { region: 'us-east-1' });
    new pagerdutyProvider.PagerdutyProvider(this, 'pagerduty_provider', {
      token: undefined,
    });
    new nullProvider.NullProvider(this, 'null-provider');
    new localProvider.LocalProvider(this, 'local-provider');
    new archiveProvider.ArchiveProvider(this, 'archive-provider');

    new S3Backend(this, {
      bucket: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      dynamodbTable: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      key: config.name,
      region: 'us-east-1',
    });

    const pocketVPC = new PocketVPC(this, 'pocket-vpc');
    const region = new dataAwsRegion.DataAwsRegion(this, 'region');
    const caller = new dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'caller',
    );

    const { primaryEndpoint, readerEndpoint } = this.createElasticache(
      this,
      pocketVPC,
    );

    this.createPocketAlbApplication({
      pagerDuty: this.createPagerDuty(),
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      primaryEndpoint,
      readerEndpoint,
      region,
      caller,
    });
  }

  /**
   * Get the sns topic for code deploy
   * @private
   */
  private getCodeDeploySnsTopic() {
    return new dataAwsSnsTopic.DataAwsSnsTopic(this, 'backend_notifications', {
      name: `Backend-${config.environment}-ChatBot`,
    });
  }

  /**
   * Get secrets manager kms alias
   * @private
   */
  private getSecretsManagerKmsAlias() {
    return new dataAwsKmsAlias.DataAwsKmsAlias(this, 'kms_alias', {
      name: 'alias/aws/secretsmanager',
    });
  }

  /**
   * Create PagerDuty service for alerts
   * @private
   */
  private createPagerDuty(): PocketPagerDuty | undefined {
    if (config.isDev) {
      return;
    }

    const incidentManagement = new DataTerraformRemoteState(
      this,
      'incident_management',
      {
        organization: 'Pocket',
        workspaces: {
          name: 'incident-management',
        },
      },
    );

    return new PocketPagerDuty(this, 'pagerduty', {
      prefix: config.prefix,
      service: {
        // This is a Tier 2 service and as such only raises non-critical alarms.
        criticalEscalationPolicyId: incidentManagement
          .get('policy_default_non_critical_id')
          .toString(),
        nonCriticalEscalationPolicyId: incidentManagement
          .get('policy_default_non_critical_id')
          .toString(),
      },
    });
  }

  private createPocketAlbApplication(dependencies: {
    pagerDuty: PocketPagerDuty;
    region: dataAwsRegion.DataAwsRegion;
    caller: dataAwsCallerIdentity.DataAwsCallerIdentity;
    secretsManagerKmsAlias: dataAwsKmsAlias.DataAwsKmsAlias;
    snsTopic: dataAwsSnsTopic.DataAwsSnsTopic;
    primaryEndpoint: string;
    readerEndpoint: string;
  }): PocketALBApplication {
    const {
      pagerDuty,
      region,
      caller,
      secretsManagerKmsAlias,
      snsTopic,
      primaryEndpoint,
      readerEndpoint,
    } = dependencies;

    const secretResources = [
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared`,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/*`,
      secretsManagerKmsAlias.targetKeyArn,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}`,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/*`,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.prefix}`,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.prefix}/*`,
    ];

    return new PocketALBApplication(this, 'application', {
      internal: true,
      prefix: config.prefix,
      alb6CharacterPrefix: config.shortName,
      tags: config.tags,
      cdn: false,
      domain: config.domain,
      containerConfigs: [
        {
          name: 'app',
          portMappings: [
            {
              hostPort: config.appPort,
              containerPort: config.appPort,
            },
          ],
          healthCheck: {
            command: [
              'CMD-SHELL',
              `curl -f http://localhost:${config.appPort}/.well-known/apollo/server-health || exit 1`,
            ],
            interval: 15,
            retries: 3,
            timeout: 5,
            startPeriod: 0,
          },
          envVars: [
            {
              name: 'NODE_ENV',
              value: process.env.NODE_ENV,
            },
            {
              name: 'REDIS_PRIMARY_ENDPOINT',
              value: primaryEndpoint,
            },
            {
              name: 'REDIS_READER_ENDPOINT',
              value: readerEndpoint,
            },
            {
              name: 'OTLP_COLLECTOR_HOST',
              value: config.tracing.host,
            },
            {
              name: 'REDIS_IS_CLUSTER',
              value: 'true',
            },
            {
              name: 'REDIS_IS_TLS',
              value: 'true',
            },
          ],
          secretEnvVars: [
            {
              name: 'IMAGE_CACHE_ENDPOINT',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/IMAGE_CACHE_ENDPOINT`,
            },
            {
              name: 'SENTRY_DSN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
            },
          ],
          logGroup: this.createCustomLogGroup('app'),
          logMultilinePattern: '^\\S.+',
        },
        {
          name: 'aws-otel-collector',
          containerImage: 'amazon/aws-otel-collector',
          essential: true,
          repositoryCredentialsParam: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/DockerHub`,
          //Used default config as stated here:
          // Available configs here: - https://github.com/aws-observability/aws-otel-collector/tree/main/config
          command: [
            '--config=/etc/ecs/ecs-xray.yaml',
            //enable for debugging
            //'--set=service.telemetry.logs.level=debug',
          ],
          portMappings: [
            {
              //default http port
              hostPort: 4138,
              containerPort: 4138,
            },
            {
              //default grpc port
              hostPort: 4137,
              containerPort: 4137,
            },
          ],
        },
      ],
      codeDeploy: {
        useCodeDeploy: true,
        useCodePipeline: false,
        useTerraformBasedCodeDeploy: false,
        generateAppSpec: false,
        notifications: {
          notifyOnFailed: true,
          notifyOnStarted: false,
          notifyOnSucceeded: false,
        },
        snsNotificationTopicArn: snsTopic.arn,
      },
      exposedContainer: {
        name: 'app',
        port: config.appPort,
        healthCheckPath: '/.well-known/apollo/server-health',
      },
      ecsIamConfig: {
        prefix: config.prefix,
        taskExecutionRolePolicyStatements: [
          //This policy could probably go in the shared module in the future.
          {
            actions: ['secretsmanager:GetSecretValue', 'kms:Decrypt'],
            resources: secretResources,
            effect: 'Allow',
          },
          //This policy could probably go in the shared module in the future.
          {
            actions: ['ssm:GetParameter*'],
            resources: [
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}`,
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/*`,
            ],
            effect: 'Allow',
          },
        ],
        taskRolePolicyStatements: [
          {
            actions: [
              'logs:PutLogEvents',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:DescribeLogStreams',
              'logs:DescribeLogGroups',
              'xray:PutTraceSegments',
              'xray:PutTelemetryRecords',
              'xray:GetSamplingRules',
              'xray:GetSamplingTargets',
              'xray:GetSamplingStatisticSummaries',
            ],
            resources: ['*'],
            effect: 'Allow',
          },
        ],
        taskExecutionDefaultAttachmentArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      autoscalingConfig: {
        targetMinCapacity: config.isDev ? 1 : 2,
        targetMaxCapacity: 10,
      },
      alarms: {
        http5xxErrorPercentage: {
          threshold: 25,
          evaluationPeriods: 4,
          period: 300,
          actions: config.isProd
            ? [pagerDuty.snsNonCriticalAlarmTopic.arn]
            : [],
        },
      },
    });
  }

  /**
   * Creates the elasticache and returns the node address list
   * @param scope
   * @private
   */
  private createElasticache(
    scope: Construct,
    pocketVPC: PocketVPC,
  ): {
    primaryEndpoint: string;
    readerEndpoint: string;
  } {
    // Serverless elasticache doesn't support the `e` availablity zone in us-east-1... so we need to filter it out..
    const privateSubnets = new dataAwsSubnets.DataAwsSubnets(
      this,
      `cache_private_subnet_ids`,
      {
        filter: [
          {
            name: 'subnet-id',
            values: pocketVPC.privateSubnetIds,
          },
          {
            name: 'availability-zone',
            values: ['us-east-1a', 'us-east-1c', 'us-east-1d'],
          },
        ],
      },
    );
    const elasticache = new ApplicationServerlessRedis(
      scope,
      'serverless_redis',
      {
        //Usually we would set the security group ids of the service that needs to hit this.
        //However we don't have the necessary security group because it gets created in PocketALBApplication
        //So instead we set it to null and allow anything within the vpc to access it.
        //This is not ideal..
        //Ideally we need to be able to add security groups to the ALB application.
        allowedIngressSecurityGroupIds: undefined,
        subnetIds: privateSubnets.ids,
        tags: config.tags,
        vpcId: pocketVPC.vpc.id,
        // add on a serverless to the name, because our previous elasticache will still exist at the old name
        prefix: `${config.prefix}-serverless`,
      },
    );

    return {
      primaryEndpoint: elasticache.elasticache.endpoint.get(0).address,
      readerEndpoint: elasticache.elasticache.readerEndpoint.get(0).address,
    };
  }

  /**
   * Create Custom log group for ECS to share across task revisions
   * @param containerName
   * @private
   */
  private createCustomLogGroup(containerName: string) {
    const logGroup = new cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      `${containerName}-log-group`,
      {
        name: `/Backend/${config.prefix}/ecs/${containerName}`,
        retentionInDays: 90,
        skipDestroy: true,
        tags: config.tags,
      },
    );

    return logGroup.name;
  }
}
const app = new App();
const stack = new ImageAPI(app, 'image-api');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
