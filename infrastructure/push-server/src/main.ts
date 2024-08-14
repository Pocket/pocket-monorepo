import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import { config } from './config';
import { PocketECSApplication } from '@pocket-tools/terraform-modules';
import * as fs from 'fs';

import {
  provider as awsProvider,
  dataAwsRegion,
  dataAwsCallerIdentity,
  cloudwatchLogGroup,
  dataAwsKmsAlias,
  dataAwsSqsQueue,
  dataAwsSnsTopic,
} from '@cdktf/provider-aws';
import { provider as nullProvider } from '@cdktf/provider-null';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as archiveProvider } from '@cdktf/provider-archive';

class PushServer extends TerraformStack {
  config: any;
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
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

    const region = new dataAwsRegion.DataAwsRegion(this, 'region');
    const caller = new dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'caller',
    );

    //NOTE: THis service uses CPU based autoscaling, this should move to SQS based autoscaling based on the Job queue in the future.
    // https://mozilla-hub.atlassian.net/browse/POCKET-9583
    this.createPocketECSApplication({
      region,
      caller,
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      jobQueue: new dataAwsSqsQueue.DataAwsSqsQueue(this, 'job-queue', {
        name: config.jobQueueName,
      }),
      tokenQueue: new dataAwsSqsQueue.DataAwsSqsQueue(this, 'token-queue', {
        name: config.tokenQueueName,
      }),
      snsTopic: this.getCodeDeploySnsTopic(),
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

  private createPocketECSApplication(dependencies: {
    region: dataAwsRegion.DataAwsRegion;
    caller: dataAwsCallerIdentity.DataAwsCallerIdentity;
    secretsManagerKmsAlias: dataAwsKmsAlias.DataAwsKmsAlias;
    jobQueue: dataAwsSqsQueue.DataAwsSqsQueue;
    tokenQueue: dataAwsSqsQueue.DataAwsSqsQueue;
    snsTopic: dataAwsSnsTopic.DataAwsSnsTopic;
  }): PocketECSApplication {
    const { region, caller, secretsManagerKmsAlias, jobQueue, tokenQueue } =
      dependencies;

    const secretResources = [
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared`,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/*`,
      secretsManagerKmsAlias.targetKeyArn,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}`,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/*`,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.prefix}`,
      `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.prefix}/*`,
    ];

    return new PocketECSApplication(this, 'application', {
      tags: config.tags,
      prefix: config.prefix,
      containerConfigs: [
        {
          name: 'app',
          logMultilinePattern: '^\\S.+',
          logGroup: this.createCustomLogGroup('app'),
          envVars: [
            {
              name: 'NODE_ENV',
              value: process.env.NODE_ENV,
            },

            {
              name: 'JOB_QUEUE_URL',
              value: jobQueue.url,
            },
            {
              name: 'TOKEN_QUEUE_URL',
              value: tokenQueue.url,
            },
          ],
          secretEnvVars: [
            {
              name: 'SENTRY_DSN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
            },
            {
              name: 'GCM_PROJECT_ID',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/GCM_PROJECT_ID`,
            },
            {
              name: 'GCM_CLIENT_EMAIL',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/GCM_CLIENT_EMAIL`,
            },
            {
              name: 'GCM_PRIVATE_KEY',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/GCM_PRIVATE_KEY`,
            },
            {
              name: 'NUMBER_OF_WORKERS',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/NUMBER_OF_WORKERS`,
            },
            {
              name: 'TIME_BETWEEN_RESTARTS',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/TIME_BETWEEN_RESTARTS`,
            },
            {
              name: 'APNS_P8_KEY',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/APNS_P8_KEY`,
            },
            {
              name: 'APNS_KEY_ID',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/APNS_KEY_ID`,
            },
            {
              name: 'APNS_TEAM_ID',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/APNS_TEAM_ID`,
            },
            {
              name: 'APNS_BETA_BUNDLE_ID',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/APNS_BETA_BUNDLE_ID`,
            },
            {
              name: 'APNS_PROD_BUNDLE_ID',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/APNS_PROD_BUNDLE_ID`,
            },
          ],
        },
      ],
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
            resources: [tokenQueue.arn, jobQueue.arn],
          },
        ],
        taskExecutionDefaultAttachmentArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      autoscalingConfig: {
        targetMinCapacity: 2,
        targetMaxCapacity: 10,
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
const stack = new PushServer(app, 'push-server');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
