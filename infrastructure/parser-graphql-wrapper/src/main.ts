import { config } from './config';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsKmsAlias } from '@cdktf/provider-aws/lib/data-aws-kms-alias';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DataAwsSnsTopic } from '@cdktf/provider-aws/lib/data-aws-sns-topic';
import { DataPagerdutyEscalationPolicy } from '@cdktf/provider-pagerduty/lib/data-pagerduty-escalation-policy';
import { LocalProvider } from '@cdktf/provider-local/lib/provider';
import { NullProvider } from '@cdktf/provider-null/lib/provider';
import { PagerdutyProvider } from '@cdktf/provider-pagerduty/lib/provider';
import {
  ApplicationRedis,
  ApplicationRDSCluster,
  PocketALBApplication,
  PocketPagerDuty,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { Construct } from 'constructs';
import { App, RemoteBackend, TerraformStack, Aspects, MigrateIds } from 'cdktf';
import * as fs from 'fs';
class ParserGraphQLWrapper extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new ArchiveProvider(this, 'archive_provider');
    new AwsProvider(this, 'aws', { region: 'us-east-1' });
    new LocalProvider(this, 'local_provider');
    new NullProvider(this, 'null_provider');
    new PagerdutyProvider(this, 'pagerduty_provider', { token: undefined });

    new RemoteBackend(this, {
      hostname: 'app.terraform.io',
      organization: 'Pocket',
      workspaces: [
        {
          name: `${config.name}-${config.environment}`,
        },
      ],
    });

    const region = new DataAwsRegion(this, 'region');
    const caller = new DataAwsCallerIdentity(this, 'caller');
    const vpc = new PocketVPC(this, 'pocket-vpc');
    const { primaryEndpoint, readerEndpoint } = this.createElasticache(
      this,
      vpc,
    );

    this.createPocketAlbApplication({
      pagerDuty: this.createPagerDuty(),
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      primaryEndpoint,
      readerEndpoint,
      region,
      caller,
      vpc,
    });

    // Pre cdktf 0.17 ids were generated differently so we need to apply a migration aspect
    // https://developer.hashicorp.com/terraform/cdktf/concepts/aspects
    Aspects.of(this).add(new MigrateIds());
  }

  /**
   * Get the sns topic for code deploy
   * @private
   */
  private getCodeDeploySnsTopic() {
    return new DataAwsSnsTopic(this, 'backend_notifications', {
      name: `Backend-${config.environment}-ChatBot`,
    });
  }

  /**
   * Get secrets manager kms alias
   * @private
   */
  private getSecretsManagerKmsAlias() {
    return new DataAwsKmsAlias(this, 'kms_alias', {
      name: 'alias/aws/secretsmanager',
    });
  }

  /**
   * Create PagerDuty service for alerts
   * @private
   */
  private createPagerDuty() {
    const mozillaEscalation = new DataPagerdutyEscalationPolicy(
      this,
      'mozilla_sre_escalation_policy',
      {
        name: 'IT SRE: Escalation Policy',
      },
    );

    return new PocketPagerDuty(this, 'pagerduty', {
      prefix: config.prefix,
      service: {
        criticalEscalationPolicyId: mozillaEscalation.id,
        nonCriticalEscalationPolicyId: mozillaEscalation.id,
      },
    });
  }

  private createPocketAlbApplication(dependencies: {
    pagerDuty: PocketPagerDuty;
    region: DataAwsRegion;
    caller: DataAwsCallerIdentity;
    secretsManagerKmsAlias: DataAwsKmsAlias;
    snsTopic: DataAwsSnsTopic;
    primaryEndpoint: string;
    readerEndpoint: string;
    vpc: PocketVPC;
  }): PocketALBApplication {
    const {
      pagerDuty,
      region,
      caller,
      secretsManagerKmsAlias,
      snsTopic,
      primaryEndpoint,
      readerEndpoint,
      vpc,
    } = dependencies;

    const PocketSharesSecretPrefix = `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:ParserWrapperApi/${config.environment}/POCKET_SHARES`;
    const PocketSecretsPrefix = `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:ParserWrapperApi/${config.environment}/SECRETS`;

    const secretResources = [
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared`,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/*`,
      secretsManagerKmsAlias.targetKeyArn,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}`,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/*`,
      `${PocketSharesSecretPrefix}*`,
      `${PocketSharesSecretPrefix}/*`,
      `${PocketSecretsPrefix}*`,
      `${PocketSecretsPrefix}/*`,
    ];

    let rdsCluster: ApplicationRDSCluster;
    // Set out the DB connection details for the production (legacy) database.
    if (config.isDev) {
      rdsCluster = this.createSharedUrlsRds(vpc);
      // Add Dev RDS-specific secrets if in Dev environment
      secretResources.push(rdsCluster.secretARN);
    }

    return new PocketALBApplication(this, 'application', {
      internal: true,
      prefix: config.prefix,
      alb6CharacterPrefix: config.shortName,
      tags: config.tags,
      cdn: false,
      domain: config.domain,
      taskSize: {
        cpu: 2048,
        memory: 4096,
      },
      containerConfigs: [
        {
          name: 'app',
          envVars: [
            {
              name: 'AWS_XRAY_CONTEXT_MISSING',
              value: 'IGNORE_ERROR',
            },
            {
              name: 'AWS_XRAY_LOG_LEVEL',
              value: 'silent',
            },
            {
              name: 'ENVIRONMENT',
              value: process.env.NODE_ENV,
            },
            {
              name: 'OTLP_COLLECTOR_HOST',
              value: config.tracing.host,
            },
            {
              name: 'REDIS_PRIMARY_ENDPOINT',
              value: primaryEndpoint,
            },
            {
              name: 'REDIS_READER_ENDPOINT',
              value: readerEndpoint,
            },
          ],
          healthCheck: {
            command: [
              'CMD-SHELL',
              'curl -f http://localhost:4001/.well-known/apollo/server-health || exit 1',
            ],
            interval: 5,
            retries: 3,
            timeout: 5,
            startPeriod: 30,
          },
          logMultilinePattern: '^\\S.+',
          logGroup: this.createCustomLogGroup('app'),
          portMappings: [
            {
              hostPort: 4001,
              containerPort: 4001,
            },
          ],
          secretEnvVars: [
            {
              name: 'DB_HOST',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/READITLA_DB:host::`,
            },
            {
              name: 'DB_USERNAME',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/READITLA_DB:username::`,
            },
            {
              name: 'DB_PASSWORD',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/READITLA_DB:password::`,
            },
            {
              name: 'SENTRY_DSN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
            },
            {
              name: 'POCKET_SHARES_DATABASE_WRITE_HOST',
              valueFrom: `${PocketSharesSecretPrefix}:host::`,
            },
            {
              name: 'POCKET_SHARES_DATABASE_WRITE_USER',
              valueFrom: `${PocketSharesSecretPrefix}:username::`,
            },
            {
              name: 'POCKET_SHARES_DATABASE_WRITE_PASSWORD',
              valueFrom: `${PocketSharesSecretPrefix}:password::`,
            },
            {
              name: 'PARSER_URL',
              valueFrom: `${PocketSecretsPrefix}:parser_endpoint::`,
            },
            {
              name: 'SHORT_PREFIX',
              valueFrom: `${PocketSecretsPrefix}:short_prefix::`,
            },
            {
              name: 'SHORT_PREFIX_SECURE',
              valueFrom: `${PocketSecretsPrefix}:short_prefix_secure::`,
            },
            {
              name: 'SHORT_CODE_CHARS',
              valueFrom: `${PocketSecretsPrefix}:short_code_chars::`,
            },
          ],
        },
        {
          name: 'aws-otel-collector',
          command: ['--config=/etc/ecs/ecs-xray.yaml'],
          containerImage: 'amazon/aws-otel-collector',
          essential: true,
          logMultilinePattern: '^\\S.+',
          logGroup: this.createCustomLogGroup('aws-otel-collector'),
          portMappings: [
            {
              hostPort: 4138,
              containerPort: 4138,
            },
            {
              hostPort: 4137,
              containerPort: 4137,
            },
          ],
          repositoryCredentialsParam: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/DockerHub`,
        },
      ],
      codeDeploy: {
        useCodeDeploy: true,
        useCodePipeline: false,
        useTerraformBasedCodeDeploy: false,
        snsNotificationTopicArn: snsTopic.arn,
        notifications: {
          //only notify on failed deploys
          notifyOnFailed: true,
          notifyOnStarted: false,
          notifyOnSucceeded: false,
        },
      },
      exposedContainer: {
        name: 'app',
        port: 4001,
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
        targetMinCapacity: config.environment === 'Prod' ? 4 : 2,
        targetMaxCapacity: config.environment === 'Prod' ? 10 : 10,
      },
      alarms: {
        //Triggers critical alert if 25% of request throws 5xx for
        // 4 continuous evaluation period within 20 mins (5 mins per period)
        http5xxErrorPercentage: {
          threshold: 25, //percent
          evaluationPeriods: 4,
          period: 300, //in seconds, 5 mins per period
          actions: config.isProd ? [pagerDuty.snsCriticalAlarmTopic.arn] : [],
          alarmDescription:
            'Runbook: https://getpocket.atlassian.net/l/c/zsRAw0KV',
        },
        httpLatency: {
          //Triggers non-critical alert if latency goes over 500ms
          // 4 continuous evaluation period within 1 hour (15 mins per period)
          evaluationPeriods: 4,
          threshold: 0.5, //in seconds
          period: 900, //in seconds, 15 mins per period
          actions: config.isProd
            ? [] // TODO: Re-enable once we have better logging [pagerDuty.snsNonCriticalAlarmTopic.arn]
            : [],
          alarmDescription:
            'Runbook: https://getpocket.atlassian.net/l/c/w2X57Zyu',
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
    const elasticache = new ApplicationRedis(scope, 'redis', {
      //Usually we would set the security group ids of the service that needs to hit this.
      //However we don't have the necessary security group because it gets created in PocketALBApplication
      //So instead we set it to null and allow anything within the vpc to access it.
      //This is not ideal..
      //Ideally we need to be able to add security groups to the ALB application.
      allowedIngressSecurityGroupIds: undefined,
      node: {
        count: config.cacheNodes,
        size: config.cacheSize,
      },
      subnetIds: pocketVPC.privateSubnetIds,
      tags: config.tags,
      vpcId: pocketVPC.vpc.id,
      prefix: config.prefix,
    });

    return {
      primaryEndpoint:
        elasticache.elasticacheReplicationGroup.primaryEndpointAddress,
      readerEndpoint:
        elasticache.elasticacheReplicationGroup.readerEndpointAddress,
    };
  }

  /**
   * Creates a serverless aurora RDS.
   * This function should only be used when the environment is Dev
   * @private
   */
  private createSharedUrlsRds(vpc: PocketVPC) {
    return new ApplicationRDSCluster(this, 'dev-shares-aurora', {
      prefix: `ParserWrapperApiDev-PocketShares`,
      vpcId: vpc.vpc.id,
      subnetIds: vpc.privateSubnetIds,
      rdsConfig: {
        databaseName: config.pocketSharedRds.databaseName,
        masterUsername: config.pocketSharedRds.masterUsername,
        skipFinalSnapshot: true,
        engine: 'aurora-mysql',
        engineMode: 'serverless',
        scalingConfiguration: {
          minCapacity: config.pocketSharedRds.minCapacity,
          maxCapacity: config.pocketSharedRds.maxCapacity,
          autoPause: false,
        },
        deletionProtection: false,
      },
      tags: config.tags,
    });
  }

  /**
   * Create Custom log group for ECS to share across task revisions
   * @param containerName
   * @private
   */
  private createCustomLogGroup(containerName: string) {
    const logGroup = new CloudwatchLogGroup(
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
const stack = new ParserGraphQLWrapper(app, 'parser-graphql-wrapper');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
