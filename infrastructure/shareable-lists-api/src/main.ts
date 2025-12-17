import { config } from './config/index.ts';
import {
  provider as awsProvider,
  sqsQueue,
  cloudwatchLogGroup,
  dataAwsCallerIdentity,
  dataAwsKmsAlias,
  dataAwsRegion,
  dataAwsSnsTopic,
  dataAwsS3Bucket,
} from '@cdktf/provider-aws';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as archiveProvider } from '@cdktf/provider-archive';
import { provider as nullProvider } from '@cdktf/provider-null';
import {
  ApplicationSQSQueue,
  ApplicationSqsSnsTopicSubscription,
  PocketALBApplication,
  PocketAwsSyntheticChecks,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import * as fs from 'fs';
import { SQSLambda } from './SQSLambda.ts';

class ShareableListsAPI extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new archiveProvider.ArchiveProvider(this, 'archive-provider');
    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
    });
    new localProvider.LocalProvider(this, 'local_provider');
    new nullProvider.NullProvider(this, 'null_provider');

    new S3Backend(this, {
      bucket: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      dynamodbTable: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      key: config.name,
      region: 'us-east-1',
    });

    const caller = new dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'caller',
    );
    const pocketVpc = new PocketVPC(this, 'pocket-vpc');
    const region = new dataAwsRegion.DataAwsRegion(this, 'region');

    const sqsLambda = new SQSLambda(
      this,
      'sqs-event-consumer',
      pocketVpc,
      region,
      caller,
    );
    const lambda = sqsLambda.lambda;

    // account delete handler - we delete all user list data when the
    // underlying account is deleted
    new ApplicationSqsSnsTopicSubscription(
      this,
      'user-events-sns-subscription',
      {
        name: config.prefix,
        snsTopicArn: `arn:aws:sns:${pocketVpc.region}:${pocketVpc.accountId}:${config.lambda.snsTopicName.userEvents}`,
        sqsQueue: lambda.sqsQueueResource,
        tags: config.tags,
        dependsOn: [lambda.sqsQueueResource as sqsQueue.SqsQueue],
      },
    );

    // Export work queue
    const exportQueue = new ApplicationSQSQueue(
      this,
      'sharelists-export-consumer-queue',
      {
        name: config.export.queue,
        tags: config.tags,
        visibilityTimeoutSeconds: 1800,
        messageRetentionSeconds: 1209600, //14 days
        //need to set maxReceiveCount to enable DLQ
        maxReceiveCount: 3,
      },
    );

    // Subscription to list export topic
    new ApplicationSqsSnsTopicSubscription(
      this,
      'list-events-sns-subscription',
      {
        name: `${config.export.queue}-SNS`,
        snsTopicArn: `arn:aws:sns:${pocketVpc.region}:${pocketVpc.accountId}:${config.export.requestTopic}`,
        sqsQueue: exportQueue.sqsQueue,
        filterPolicyScope: 'MessageBody',
        filterPolicy: JSON.stringify({
          'detail-type': ['list-export-requested'],
        }),
        tags: config.tags,
      },
    );

    const alarmSnsTopic = this.getCodeDeploySnsTopic();

    // Align with account-data-deleter (source of truth)
    const exportBucket = new dataAwsS3Bucket.DataAwsS3Bucket(
      this,
      'export-bucket',
      {
        bucket: `com.getpocket-${config.environment.toLowerCase()}.list-exports`,
      },
    );

    this.createPocketAlbApplication({
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: alarmSnsTopic,
      exportSqs: exportQueue.sqsQueue,
      region,
      caller,
      exportBucket,
    });

    new PocketAwsSyntheticChecks(this, 'synthetics', {
      alarmTopicArn: config.isProd ? alarmSnsTopic.arn : '',
      environment: config.environment,
      prefix: config.prefix,
      query: [
        {
          endpoint: config.domain,
          data: '{"query": "query { shareableListPublic(externalId: \\"1\\", slug: \\"1\\") {externalId} }"}',
          jmespath: 'errors[0].message',
          response: 'Error - Not Found: A list by that URL could not be found',
        },
      ],
      securityGroupIds: pocketVpc.defaultSecurityGroups.ids,
      shortName: config.shortName,
      subnetIds: pocketVpc.privateSubnetIds,
      tags: config.tags,
      uptime: [
        {
          response: 'ok',
          url: `${config.domain}/.well-known/apollo/server-health`,
        },
      ],
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

  private createPocketAlbApplication(dependencies: {
    region: dataAwsRegion.DataAwsRegion;
    caller: dataAwsCallerIdentity.DataAwsCallerIdentity;
    secretsManagerKmsAlias: dataAwsKmsAlias.DataAwsKmsAlias;
    snsTopic: dataAwsSnsTopic.DataAwsSnsTopic;
    exportSqs: sqsQueue.SqsQueue;
    exportBucket: dataAwsS3Bucket.DataAwsS3Bucket;
  }): PocketALBApplication {
    const {
      region,
      caller,
      secretsManagerKmsAlias,
      snsTopic,
      exportSqs,
      exportBucket,
    } = dependencies;

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
          portMappings: [
            {
              hostPort: 4029,
              containerPort: 4029,
            },
          ],
          healthCheck: {
            command: [
              'CMD-SHELL',
              'curl -f http://localhost:4029/.well-known/apollo/server-health || exit 1',
            ],
            interval: 15,
            retries: 3,
            timeout: 5,
            startPeriod: 0,
          },
          envVars: [
            {
              name: 'ENVIRONMENT',
              value: process.env.NODE_ENV ?? 'development',
            },
            {
              name: 'EVENT_BUS_NAME',
              value: config.eventBusName,
            },
            {
              name: 'NODE_ENV',
              value: process.env.NODE_ENV ?? 'development',
            },
            {
              name: 'REDIS_IS_CLUSTER',
              value: 'true',
            },
            {
              name: 'REDIS_IS_TLS',
              value: 'true',
            },
            {
              name: 'EXPORT_QUEUE_URL',
              value: `https://sqs.${region.name}.amazonaws.com/${caller.accountId}/${config.export.queue}`,
            },
            {
              // Align with source: infrastructure/account-data-deleter
              name: 'EXPORT_BUCKET',
              value: exportBucket.bucket,
            },
          ],
          logGroup: this.createCustomLogGroup('app'),
          logMultilinePattern: '^\\S.+',
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
        port: 4029,
        healthCheckPath: '/.well-known/apollo/server-health',
      },
      ecsIamConfig: {
        prefix: config.prefix,
        taskExecutionRolePolicyStatements: [
          //This policy could probably go in the shared module in the future.
          {
            actions: ['secretsmanager:GetSecretValue', 'kms:Decrypt'],
            resources: [
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/*`,
              secretsManagerKmsAlias.targetKeyArn,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/*`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.prefix}`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.prefix}/*`,
            ],
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
            // export queue
            actions: [
              'sqs:ReceiveMessage',
              'sqs:DeleteMessage',
              'sqs:SendMessage',
              'sqs:SendMessageBatch',
            ],
            resources: [exportSqs.arn],
            effect: 'Allow',
          },
          {
            actions: ['events:PutEvents'],
            resources: [
              `arn:aws:events:${region.name}:${caller.accountId}:event-bus/${config.eventBusName}`,
            ],
            effect: 'Allow',
          },
          {
            // Bucket actions
            actions: ['s3:ListBucket'],
            resources: [exportBucket.arn],
            effect: 'Allow',
          },
          {
            // Object actions
            actions: ['s3:*Object'],
            resources: [`${exportBucket.arn}/*`],
            effect: 'Allow',
          },
        ],
        taskExecutionDefaultAttachmentArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      autoscalingConfig: {
        targetMinCapacity: config.isProd ? 2 : 1,
        targetMaxCapacity: config.isProd ? 5 : 1,
      },
      alarms: {},
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
const stack = new ShareableListsAPI(app, 'shareable-lists-api');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
