import { provider as archiveProvider } from '@cdktf/provider-archive';
import {
  provider as awsProvider,
  dataAwsCallerIdentity,
  dataAwsRegion,
  dataAwsKmsAlias,
  dataAwsSnsTopic,
  cloudwatchLogGroup,
} from '@cdktf/provider-aws';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import {
  provider as pagerdutyProvider,
  dataPagerdutyEscalationPolicy,
} from '@cdktf/provider-pagerduty';
import {
  ApplicationRDSCluster,
  PocketALBApplication,
  PocketPagerDuty,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import { config } from './config';

class ListAPI extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
    });
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
    this.createPocketAlbApplication({
      pagerDuty: this.createPagerDuty(),
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      region,
      caller,
      vpc: pocketVPC,
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
  private createPagerDuty() {
    // don't create any pagerduty resources if in dev
    if (config.isDev) {
      return undefined;
    }

    const nonCriticalEscalationPolicyId =
      new dataPagerdutyEscalationPolicy.DataPagerdutyEscalationPolicy(
        this,
        'non_critical_escalation_policy',
        {
          name: 'Pocket On-Call: Default Non-Critical - Tier 2+ (Former Backend Temporary Holder)',
        },
      ).id;

    return new PocketPagerDuty(this, 'pagerduty', {
      prefix: config.prefix,
      service: {
        // This is a Tier 2 service and as such only raises non-critical alarms.
        criticalEscalationPolicyId: nonCriticalEscalationPolicyId,
        nonCriticalEscalationPolicyId: nonCriticalEscalationPolicyId,
      },
    });
  }

  /**
   * Creates a serverless aurora RDS.
   * This function should only be used when the environment is Dev
   * @private
   */
  private createRds(vpc: PocketVPC) {
    return new ApplicationRDSCluster(this, 'dev-aurora', {
      prefix: `${config.prefix}`,
      vpcId: vpc.vpc.id,
      subnetIds: vpc.privateSubnetIds,
      rdsConfig: {
        databaseName: config.rds.databaseName,
        masterUsername: config.rds.masterUsername,
        skipFinalSnapshot: true,
        engine: 'aurora-mysql',
        engineMode: 'serverless',
        scalingConfiguration: {
          minCapacity: config.rds.minCapacity,
          maxCapacity: config.rds.maxCapacity,
          autoPause: false,
        },
        deletionProtection: false,
      },
      tags: config.tags,
    });
  }

  private createPocketAlbApplication(dependencies: {
    pagerDuty: PocketPagerDuty;
    region: dataAwsRegion.DataAwsRegion;
    caller: dataAwsCallerIdentity.DataAwsCallerIdentity;
    secretsManagerKmsAlias: dataAwsKmsAlias.DataAwsKmsAlias;
    snsTopic: dataAwsSnsTopic.DataAwsSnsTopic;
    vpc: PocketVPC;
  }): PocketALBApplication {
    const { pagerDuty, region, caller, secretsManagerKmsAlias, snsTopic, vpc } =
      dependencies;

    const databaseSecretsArn = `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/READITLA_DB`;

    /**
     * Create an RDS instance if we are working in the Dev account.
     * This is only to facilitate testing
     */
    let rdsCluster: ApplicationRDSCluster;

    const intMaskSecretArn = `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/IntMask`;

    const secretResources = [
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared`,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/*`,
      secretsManagerKmsAlias.targetKeyArn,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}`,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/*`,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.prefix}`,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.prefix}/*`,
      `${intMaskSecretArn}*`,
      `${intMaskSecretArn}/*`,
    ];

    // Set out the DB connection details for the production (legacy) database.
    let databaseSecretEnvVars = {
      readHost: `${databaseSecretsArn}:read_host::`,
      readUser: `${databaseSecretsArn}:read_username::`,
      readPassword: `${databaseSecretsArn}:read_password::`,
      writeHost: `${databaseSecretsArn}:write_host::`,
      writeUser: `${databaseSecretsArn}:write_username::`,
      writePassword: `${databaseSecretsArn}:write_password::`,
    };

    if (config.isDev) {
      rdsCluster = this.createRds(vpc);
      // Add Dev RDS-specific secrets if in Dev environment
      secretResources.push(rdsCluster.secretARN);

      // Specify DB connection details for the RDS cluster on Dev
      databaseSecretEnvVars = {
        readHost: rdsCluster.secretARN + ':host::',
        readUser: rdsCluster.secretARN + ':username::',
        readPassword: rdsCluster.secretARN + ':password::',
        writeHost: rdsCluster.secretARN + ':host::',
        writeUser: rdsCluster.secretARN + ':username::',
        writePassword: rdsCluster.secretARN + ':password::',
      };
    }

    return new PocketALBApplication(this, 'application', {
      internal: true,
      prefix: config.prefix,
      alb6CharacterPrefix: config.shortName,
      tags: config.tags,
      cdn: false,
      domain: config.domain,
      accessLogs: {
        existingBucket: config.s3LogsBucket,
      },
      taskSize: {
        cpu: 1024,
        memory: 2048,
      },
      containerConfigs: [
        {
          name: 'app',
          portMappings: [
            {
              hostPort: 4005,
              containerPort: 4005,
            },
          ],
          healthCheck: {
            command: [
              'CMD-SHELL',
              'curl -f http://localhost:4005/.well-known/apollo/server-health || exit 1',
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
              name: 'DATABASE_READ_PORT',
              value: config.envVars.databasePort,
            },
            {
              name: 'DATABASE_WRITE_PORT',
              value: config.envVars.databasePort,
            },
            {
              name: 'SQS_PUBLISHER_DATA_QUEUE_URL',
              value: `https://sqs.${region.name}.amazonaws.com/${caller.accountId}/${config.envVars.sqsPublisherDataQueueName}`,
            },
            {
              name: 'SQS_BATCH_DELETE_QUEUE_URL',
              value: `https://sqs.${region.name}.amazonaws.com/${caller.accountId}/${config.envVars.sqsBatchDeleteQueueName}`,
            },
            {
              name: 'SQS_PERMLIB_ITEMMAIN_QUEUE_URL',
              value: `https://sqs.${region.name}.amazonaws.com/${caller.accountId}/${config.envVars.sqsPermLibItemMainQueueName}`,
            },
            {
              name: 'KINESIS_UNIFIED_EVENT_STREAM',
              value: config.envVars.unifiedEventStreamName,
            },
            {
              name: 'DATABASE_TZ',
              value: config.envVars.databaseTz,
            },
            {
              name: 'EVENT_BUS_NAME',
              value: config.envVars.eventBusName,
            },
            {
              name: 'OTLP_COLLECTOR_HOST',
              value: config.tracing.host,
            },
          ],
          secretEnvVars: [
            {
              name: 'PARSER_DOMAIN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/PARSER_DOMAIN`,
            },
            {
              name: 'SNOWPLOW_ENDPOINT',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SNOWPLOW_ENDPOINT`,
            },
            {
              name: 'UNLEASH_ENDPOINT',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/UNLEASH_ENDPOINT`,
            },
            {
              name: 'SENTRY_DSN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
            },
            {
              name: 'DATABASE_READ_HOST',
              valueFrom: databaseSecretEnvVars.readHost,
            },
            {
              name: 'DATABASE_READ_USER',
              valueFrom: databaseSecretEnvVars.readUser,
            },
            {
              name: 'DATABASE_READ_PASSWORD',
              valueFrom: databaseSecretEnvVars.readPassword,
            },
            {
              name: 'DATABASE_WRITE_HOST',
              valueFrom: databaseSecretEnvVars.writeHost,
            },
            {
              name: 'DATABASE_WRITE_USER',
              valueFrom: databaseSecretEnvVars.writeUser,
            },
            {
              name: 'DATABASE_WRITE_PASSWORD',
              valueFrom: databaseSecretEnvVars.writePassword,
            },
            {
              name: 'UNLEASH_KEY',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/UNLEASH_KEY`,
            },
            {
              name: 'CHARACTER_MAP',
              valueFrom: `${intMaskSecretArn}:characterMap::`,
            },
            {
              name: 'POSITION_MAP',
              valueFrom: `${intMaskSecretArn}:positionMap::`,
            },
            {
              name: 'MD5_RANDOMIZER',
              valueFrom: `${intMaskSecretArn}:md5Randomizer::`,
            },
            {
              name: 'LETTER_INDEX',
              valueFrom: `${intMaskSecretArn}:letterIndex::`,
            },
            {
              name: 'SALT_1',
              valueFrom: `${intMaskSecretArn}:salt1::`,
            },
            {
              name: 'SALT_2',
              valueFrom: `${intMaskSecretArn}:salt2::`,
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
        port: 4005,
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
          {
            actions: ['sqs:SendMessage', 'sqs:SendMessageBatch'],
            resources: [
              `arn:aws:sqs:${region.name}:${caller.accountId}:${config.envVars.sqsPublisherDataQueueName}`,
              `arn:aws:sqs:${region.name}:${caller.accountId}:${config.envVars.sqsPermLibItemMainQueueName}`,
            ],
            effect: 'Allow',
          },
          {
            //no permission for batchReceive as we want only one message polled at a time
            actions: [
              'sqs:ReceiveMessage',
              'sqs:DeleteMessage',
              'sqs:SendMessage',
              'sqs:SendMessageBatch',
            ],
            resources: [
              `arn:aws:sqs:${region.name}:${caller.accountId}:${config.envVars.sqsBatchDeleteQueueName}`,
            ],
            effect: 'Allow',
          },
          {
            actions: ['kinesis:PutRecord', 'kinesis:PutRecords'],
            resources: [
              `arn:aws:kinesis:${region.name}:${caller.accountId}:stream/${config.envVars.unifiedEventStreamName}`,
            ],
            effect: 'Allow',
          },
          {
            actions: ['events:PutEvents'],
            resources: [
              `arn:aws:events:${region.name}:${caller.accountId}:event-bus/${config.envVars.eventBusName}`,
            ],
            effect: 'Allow',
          },
        ],
        taskExecutionDefaultAttachmentArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      autoscalingConfig: {
        targetMinCapacity: config.environment === 'Prod' ? 2 : 2,
        targetMaxCapacity: config.environment === 'Prod' ? 10 : 10,
      },
      alarms: {
        http5xxErrorPercentage: {
          threshold: 25,
          evaluationPeriods: 4,
          period: 300,
          actions: config.isDev ? [] : [pagerDuty.snsNonCriticalAlarmTopic.arn],
        },
      },
    });
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
new ListAPI(app, 'list-api');
app.synth();