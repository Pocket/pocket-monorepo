import { config } from './config/index.ts';
import { PocketALBApplication } from '@pocket-tools/terraform-modules';
import {
  dataAwsCallerIdentity,
  dataAwsKmsAlias,
  dataAwsRegion,
  dataAwsSnsTopic,
  sqsQueue,
  cloudwatchLogGroup,
} from '@cdktf/provider-aws';
import { Construct } from 'constructs';

export type SharedSnowplowConsumerProps = {
  caller: dataAwsCallerIdentity.DataAwsCallerIdentity;
  region: dataAwsRegion.DataAwsRegion;
  secretsManagerKmsAlias: dataAwsKmsAlias.DataAwsKmsAlias;
  snsTopic: dataAwsSnsTopic.DataAwsSnsTopic;
  sqsConsumeQueue: sqsQueue.SqsQueue;
  sqsDLQ: sqsQueue.SqsQueue;
};

export class SharedSnowplowConsumerApp extends Construct {
  constructor(
    scope: Construct,
    private name: string,
    private config: SharedSnowplowConsumerProps,
  ) {
    super(scope, name.toLowerCase());
    this.createPocketAlbApplication();
  }

  private createPocketAlbApplication(): PocketALBApplication {
    const { region, caller, secretsManagerKmsAlias, snsTopic } = this.config;

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
      accessLogs: {
        existingBucket: config.s3LogsBucket,
      },
      containerConfigs: [
        {
          name: 'app',
          logMultilinePattern: '^\\S.+',
          logGroup: this.createCustomLogGroup('app'),
          portMappings: [
            {
              hostPort: 4015,
              containerPort: 4015,
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
          envVars: [
            {
              name: 'NODE_ENV',
              value: process.env.NODE_ENV ?? 'development',
            },

            {
              name: 'SNOWPLOW_ENDPOINT',
              value: config.envVars.snowplowEndpoint,
            },
            {
              name: 'SNOWPLOW_EVENTS_SQS_QUEUE',
              value: this.config.sqsConsumeQueue.url,
            },
            {
              name: 'SNOWPLOW_EVENTS_DLQ_URL',
              value: this.config.sqsDLQ.url,
            },
          ],
          secretEnvVars: [
            {
              name: 'SENTRY_DSN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
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
        port: 4015,
        healthCheckPath: '/health',
      },
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
            actions: [
              'sqs:DeleteMessage',
              'sqs:ReceiveMessage',
              'sqs:SendMessage',
              'sqs:SendMessageBatch',
            ],
            resources: [
              this.config.sqsConsumeQueue.arn,
              this.config.sqsDLQ.arn,
            ],
          },
        ],
        taskExecutionDefaultAttachmentArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      autoscalingConfig: {
        targetMinCapacity: 1,
        targetMaxCapacity: 5,
      },
      alarms: {
        http5xxErrorPercentage: {
          threshold: 25,
          evaluationPeriods: 4,
          period: 300, //5 mins each
          actions: config.isDev ? [] : [snsTopic.arn],
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
