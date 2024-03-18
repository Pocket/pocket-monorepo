import { config } from './config/index.js';

import { cloudwatchLogGroup, dataAwsCallerIdentity, dataAwsKmsAlias, dataAwsRegion, dataAwsSnsTopic, sqsQueue } from '@cdktf/provider-aws';

import {
  PocketALBApplication,
  PocketPagerDuty,
} from '@pocket-tools/terraform-modules';

import { Construct } from 'constructs';

export type DataDeleterAppConfig = {
  pagerDuty: PocketPagerDuty;
  region: dataAwsRegion.DataAwsRegion;
  caller: dataAwsCallerIdentity.DataAwsCallerIdentity;
  secretsManagerKmsAlias: dataAwsKmsAlias.DataAwsKmsAlias;
  snsTopic: dataAwsSnsTopic.DataAwsSnsTopic;
  batchDeleteQueue: sqsQueue.SqsQueue;
  batchDeleteDLQ: sqsQueue.SqsQueue;
};

export class DataDeleterApp extends Construct {
  constructor(
    scope: Construct,
    private name: string,
    private config: DataDeleterAppConfig,
  ) {
    super(scope, name.toLowerCase());
    this.createPocketAlbApplication();
  }

  private createPocketAlbApplication(): PocketALBApplication {
    const { pagerDuty, region, caller, secretsManagerKmsAlias, snsTopic } =
      this.config;

    const databaseSecretsArn = `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/READITLA_DB`;
    // Set out the DB connection details for the production (legacy) database.
    const databaseSecretEnvVars = {
      readHost: `${databaseSecretsArn}:read_host::`,
      readUser: `${databaseSecretsArn}:read_username::`,
      readPassword: `${databaseSecretsArn}:read_password::`,
      writeHost: `${databaseSecretsArn}:write_host::`,
      writeUser: `${databaseSecretsArn}:write_username::`,
      writePassword: `${databaseSecretsArn}:write_password::`,
    };

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
      alarms: {
        http5xxErrorPercentage: {
          actions: [pagerDuty.snsNonCriticalAlarmTopic.arn],
          evaluationPeriods: 4,
          period: 300, //5 mins each
          threshold: 25,
        },
      },
      alb6CharacterPrefix: config.shortName,
      autoscalingConfig: {
        targetMinCapacity: config.isProd ? 2 : 1,
        targetMaxCapacity: config.isProd ? 3 : 1,
      },
      cdn: false,
      codeDeploy: {
        notifications: {
          notifyOnFailed: true,
          notifyOnStarted: false,
          notifyOnSucceeded: false,
        },
        snsNotificationTopicArn: snsTopic.arn,
        useCodeDeploy: true,
        useCodePipeline: false,
        useTerraformBasedCodeDeploy: false,
      },
      containerConfigs: [
        {
          name: 'app',
          imageSha: config.releaseSha,
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
              name: 'DATABASE_READ_PORT',
              value: config.envVars.databasePort,
            },
            {
              name: 'DATABASE_TZ',
              value: config.envVars.databaseTz,
            },
            {
              name: 'DATABASE_WRITE_PORT',
              value: config.envVars.databasePort,
            },
            {
              name: 'NODE_ENV',
              value: process.env.NODE_ENV,
            },
            {
              name: 'SQS_BATCH_DELETE_QUEUE_URL',
              value: `https://sqs.${region.name}.amazonaws.com/${caller.accountId}/${config.envVars.sqsBatchDeleteQueueName}`,
            },
          ],
          healthCheck: {
            command: [
              'CMD-SHELL',
              'curl -f http://localhost:4015/health || exit 1',
            ],
            interval: 15,
            retries: 3,
            timeout: 5,
            startPeriod: 0,
          },
          logGroup: this.createCustomLogGroup('app'),
          portMappings: [
            {
              hostPort: 4015,
              containerPort: 4015,
            },
          ],
          secretEnvVars: [
            {
              name: 'DATABASE_READ_HOST',
              valueFrom: databaseSecretEnvVars.readHost,
            },
            {
              name: 'DATABASE_READ_PASSWORD',
              valueFrom: databaseSecretEnvVars.readPassword,
            },
            {
              name: 'DATABASE_READ_USER',
              valueFrom: databaseSecretEnvVars.readUser,
            },
            {
              name: 'DATABASE_WRITE_HOST',
              valueFrom: databaseSecretEnvVars.writeHost,
            },
            {
              name: 'DATABASE_WRITE_PASSWORD',
              valueFrom: databaseSecretEnvVars.writePassword,
            },
            {
              name: 'DATABASE_WRITE_USER',
              valueFrom: databaseSecretEnvVars.writeUser,
            },
            {
              name: 'SENTRY_DSN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
            },
            {
              name: 'STRIPE_KEY',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/STRIPE_KEY`,
            },
            {
              name: 'UNLEASH_ENDPOINT',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/Shared/${config.environment}/UNLEASH_ENDPOINT`,
            },
            {
              name: 'UNLEASH_KEY',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/UNLEASH_KEY`,
            },
          ],
        },
      ],
      domain: config.domain,
      ecsIamConfig: {
        prefix: config.prefix,
        taskExecutionRolePolicyStatements: [
          {
            actions: ['secretsmanager:GetSecretValue', 'kms:Decrypt'],
            resources: secretResources,
            effect: 'Allow',
          },
          {
            actions: ['ssm:GetParameter*'],
            resources: [
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}`,
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/*`,
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/Shared/*`,
            ],
            effect: 'Allow',
          },
        ],
        taskRolePolicyStatements: [
          {
            actions: [
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
            //no permission for batchReceive as we want only one message polled at a time
            actions: [
              'sqs:ReceiveMessage',
              'sqs:DeleteMessage',
              'sqs:SendMessage',
              'sqs:SendMessageBatch',
            ],
            resources: [this.config.batchDeleteQueue.arn],
            effect: 'Allow',
          },
        ],
        taskExecutionDefaultAttachmentArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      exposedContainer: {
        name: 'app',
        port: 4015,
        healthCheckPath: '/health',
      },
      internal: true,
      prefix: config.prefix,
      tags: config.tags,
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
