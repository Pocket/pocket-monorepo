import { config } from './config/index.ts';

import {
  cloudwatchLogGroup,
  dataAwsCallerIdentity,
  dataAwsKmsAlias,
  dataAwsRegion,
  sqsQueue,
  dataAwsSnsTopic,
} from '@cdktf/provider-aws';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';

import { PocketALBApplication } from '@pocket-tools/terraform-modules';

import { Construct } from 'constructs';

export type DataDeleterAppConfig = {
  region: dataAwsRegion.DataAwsRegion;
  caller: dataAwsCallerIdentity.DataAwsCallerIdentity;
  secretsManagerKmsAlias: dataAwsKmsAlias.DataAwsKmsAlias;
  snsTopic: dataAwsSnsTopic.DataAwsSnsTopic;
  batchDeleteQueue: sqsQueue.SqsQueue;
  exportRequestQueue: sqsQueue.SqsQueue;
  annotationsExportQueue: sqsQueue.SqsQueue;
  listExportQueue: sqsQueue.SqsQueue;
  listExportBucket: S3Bucket;
  listExportPartsPrefix: string;
  listExportArchivesPrefix: string;
  importFileQueue: sqsQueue.SqsQueue;
  importBatchQueue: sqsQueue.SqsQueue;
  listImportBucket: S3Bucket;
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
    const { region, caller, secretsManagerKmsAlias, snsTopic } = this.config;

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

    // Don't pull these secrets unless in production (they don't exist in dev)
    const FxaEnvVars = config.isProd
      ? [
          {
            name: 'FXA_CLIENT_ID',
            valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/Web/${config.environment}/FIREFOX_WEB_AUTH_CLIENT_ID`,
          },
          {
            name: 'FXA_CLIENT_SECRET',
            valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/Web/${config.environment}/FIREFOX_WEB_AUTH_CLIENT_SECRET`,
          },
          {
            name: 'FXA_OAUTH_URL',
            valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/Web/${config.environment}/FIREFOX_AUTH_OAUTH_URL`,
          },
        ]
      : [];

    const app = new PocketALBApplication(this, 'application', {
      alarms: {
        http5xxErrorPercentage: {
          actions: config.isProd ? [] : [],
          evaluationPeriods: 4,
          period: 300, //5 mins each
          threshold: 25,
        },
      },
      taskSize: {
        cpu: config.isDev ? 512 : 2048,
        memory: config.isDev ? 2048 : 16384,
      },
      alb6CharacterPrefix: config.shortName,
      autoscalingConfig: {
        targetMinCapacity: 0,
        targetMaxCapacity: config.isProd ? 4 : 1,
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
        generateAppSpec: false,
      },
      containerConfigs: [
        {
          name: 'app',
          envVars: [
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
              value: process.env.NODE_ENV ?? 'development',
            },
            {
              name: 'SQS_BATCH_DELETE_QUEUE_URL',
              value: `https://sqs.${region.name}.amazonaws.com/${caller.accountId}/${config.envVars.sqsBatchDeleteQueueName}`,
            },
            {
              name: 'EXPORT_REQUEST_QUEUE_URL',
              value: `https://sqs.${region.name}.amazonaws.com/${caller.accountId}/${config.envVars.exportRequestQueueName}`,
            },
            {
              name: 'EXPORT_REQUEST_STATE_TABLE',
              value: '',
            },
            {
              name: 'SQS_LIST_EXPORT_QUEUE_URL',
              value: `https://sqs.${region.name}.amazonaws.com/${caller.accountId}/${config.envVars.listExportQueueName}`,
            },
            {
              name: 'SQS_ANNOTATIONS_EXPORT_QUEUE_URL',
              value: `https://sqs.${region.name}.amazonaws.com/${caller.accountId}/${config.envVars.annotationsExportQueueName}`,
            },
            {
              name: 'SQS_IMPORT_BATCH_QUEUE_URL',
              value: this.config.importBatchQueue.url,
            },
            {
              name: 'SQS_IMPORT_FILE_QUEUE_URL',
              value: this.config.importFileQueue.url,
            },
            {
              name: 'LIST_IMPORTS_BUCKET',
              value: this.config.listImportBucket.bucket,
            },
            {
              name: 'LIST_EXPORT_BUCKET',
              value: this.config.listExportBucket.bucket,
            },
            {
              name: 'LIST_EXPORT_PARTS_PREFIX',
              value: this.config.listExportPartsPrefix,
            },
            {
              name: 'LIST_EXPORT_ARCHIVE_PREFIX',
              value: this.config.listExportArchivesPrefix,
            },
            {
              name: 'EVENT_BUS_NAME',
              value: config.envVars.eventBusName,
            },
            {
              name: 'OTLP_COLLECTOR_URL',
              value: config.tracing.url,
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
            {
              name: 'EXPORT_SIGNEDURL_USER_ACCESS_KEY_ID',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/EXPORT_USER_CREDS:accessKeyId::`,
            },
            {
              name: 'EXPORT_SIGNEDURL_USER_SECRET_KEY',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/EXPORT_USER_CREDS:secretAccessKey::`,
            },
            ...FxaEnvVars,
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
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/Web/${config.environment}/FIREFOX_WEB_AUTH_CLIENT_ID`,
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/Web/${config.environment}/FIREFOX_WEB_AUTH_CLIENT_SECRET`,
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/Web/${config.environment}/FIREFOX_AUTH_OAUTH_URL`,
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
            resources: [
              this.config.batchDeleteQueue.arn,
              this.config.importFileQueue.arn,
              this.config.listExportQueue.arn,
              this.config.exportRequestQueue.arn,
              this.config.annotationsExportQueue.arn,
            ],
            effect: 'Allow',
          },
          {
            // write-only permissions
            actions: ['sqs:SendMessage', 'sqs:SendMessageBatch'],
            resources: [this.config.importBatchQueue.arn],
            effect: 'Allow',
          },
          {
            // Bucket actions
            actions: ['s3:ListBucket'],
            resources: [this.config.listExportBucket.arn],
            effect: 'Allow',
          },
          {
            // Object actions
            actions: ['s3:*Object'],
            resources: [`${this.config.listExportBucket.arn}/*`],
            effect: 'Allow',
          },
          {
            // Object actions
            actions: ['s3:GetObject'],
            resources: [`${this.config.listImportBucket.arn}/*`],
            effect: 'Allow',
          },
          {
            actions: ['events:PutEvents'],
            resources: [
              `arn:aws:events:${region.name}:${caller.accountId}:event-bus/${config.eventBusName}`,
            ],
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

    return app;
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
