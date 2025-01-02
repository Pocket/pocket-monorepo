import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import {
  provider as awsProvider,
  dataAwsCallerIdentity,
  dataAwsKmsAlias,
  dataAwsRegion,
  dataAwsSnsTopic,
  cloudwatchLogGroup,
} from '@cdktf/provider-aws';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import { provider as archiveProvider } from '@cdktf/provider-archive';
import { config } from './config';
import {
  ApplicationRDSCluster,
  ApplicationSQSQueue,
  ApplicationSqsSnsTopicSubscription,
  PocketALBApplication,
  PocketAwsSyntheticChecks,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { PocketEventType } from '@pocket-tools/event-bridge';

class NotesAPI extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
    });
    new localProvider.LocalProvider(this, 'local_provider');
    new nullProvider.NullProvider(this, 'null_provider');
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
    const pocketVPC = new PocketVPC(this, 'pocket-vpc');

    const alarmSnsTopic = this.getCodeDeploySnsTopic();
    const rds = this.createRds(pocketVPC);
    // TODO: Uncomment when ready to implement data deletion
    // const sqs = this.deleteNotificationQueue(pocketVPC);

    this.createPocketAlbApplication({
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: alarmSnsTopic,
      region,
      caller,
      rds,
      // sqs,
    });

    const youUpQuery = `query { __typename }`;

    new PocketAwsSyntheticChecks(this, 'synthetics', {
      alarmTopicArn: config.isProd ? alarmSnsTopic.arn : '',
      environment: config.environment,
      prefix: config.prefix,
      query: [
        {
          endpoint: config.domain,
          data: youUpQuery,
          jmespath: 'data.__typename',
          response: 'Query',
        },
      ],
      securityGroupIds: pocketVPC.defaultSecurityGroups.ids,
      shortName: config.shortName,
      subnetIds: pocketVPC.privateSubnetIds,
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

  /**
   * Create Aurora database
   * @param pocketVpc
   * @private
   */
  private createRds(pocketVpc: PocketVPC) {
    return new ApplicationRDSCluster(this, 'rds', {
      prefix: config.prefix,
      vpcId: pocketVpc.vpc.id,
      subnetIds: pocketVpc.privateSubnetIds,
      rdsConfig: {
        databaseName: 'pocketnotes',
        masterUsername: 'pkt_notes',
        engine: 'aurora-postgresql',
        engineMode: 'provisioned',
        engineVersion: '16.4',
        serverlessv2ScalingConfiguration: {
          minCapacity: config.rds.minCapacity,
          maxCapacity: config.rds.maxCapacity,
        },
        createServerlessV2Instance: true,
      },
      tags: config.tags,
    });
  }

  private deleteNotificationQueue(pocketVpc: PocketVPC) {
    const sqs = new ApplicationSQSQueue(this, 'batch-delete-consumer-queue', {
      name: config.envVars.sqsBatchDeleteQueueName,
      tags: config.tags,
      //need to set maxReceiveCount to enable DLQ
      maxReceiveCount: 3,
    });
    new ApplicationSqsSnsTopicSubscription(
      this,
      'user-events-sns-subscription',
      {
        name: config.prefix,
        snsTopicArn: `arn:aws:sns:${pocketVpc.region}:${pocketVpc.accountId}:${config.envVars.snsUserEventsTopic}`,
        sqsQueue: sqs.sqsQueue,
        tags: config.tags,
        dependsOn: [sqs.sqsQueue],
        filterPolicyScope: 'MessageBody',
        filterPolicy: JSON.stringify({
          'detail-type': [PocketEventType.ACCOUNT_DELETION],
        }),
      },
    );
    return sqs;
  }

  private createPocketAlbApplication(dependencies: {
    region: dataAwsRegion.DataAwsRegion;
    caller: dataAwsCallerIdentity.DataAwsCallerIdentity;
    secretsManagerKmsAlias: dataAwsKmsAlias.DataAwsKmsAlias;
    snsTopic: dataAwsSnsTopic.DataAwsSnsTopic;
    rds: ApplicationRDSCluster;
    // sqs: ApplicationSQSQueue;
  }): PocketALBApplication {
    const {
      region,
      caller,
      secretsManagerKmsAlias,
      snsTopic,
      rds,
    } = //, sqs } =
      dependencies;

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
              hostPort: config.port,
              containerPort: config.port,
            },
          ],
          healthCheck: config.healthCheck,
          envVars: [
            {
              name: 'NODE_ENV',
              value: process.env.NODE_ENV ?? 'development',
            },
            {
              name: 'ENVIRONMENT',
              value: process.env.NODE_ENV ?? 'development', // this gives us a nice lowercase production and development
            },
            {
              name: 'EVENT_BUS_NAME',
              value: config.eventBusName,
            },
            {
              name: 'AWS_REGION',
              value: region.name,
            },
            {
              name: 'SQS_BATCH_DELETE_QUEUE_URL',
              value: `https://sqs.${region.name}.amazonaws.com/${caller.accountId}/${config.envVars.sqsBatchDeleteQueueName}`,
            },
            {
              name: 'OTLP_COLLECTOR_URL',
              value: config.tracing.url,
            },
          ],
          logGroup: this.createCustomLogGroup('app'),
          logMultilinePattern: '^\\S.+',
          secretEnvVars: [
            {
              name: 'SENTRY_DSN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
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
              name: 'DATABASE_URL',
              valueFrom: `${rds.secretARN}:database_url::`,
            },
            {
              name: 'DB_WRITE_HOST',
              valueFrom: `${rds.secretARN}:host::`,
            },
            {
              name: 'DB_READ_HOST',
              valueFrom: `${rds.secretARN}:host::`,
            },
            {
              name: 'DATABASE_USER',
              valueFrom: `${rds.secretARN}:username::`,
            },
            {
              name: 'DATABASE_PASSWORD',
              valueFrom: `${rds.secretARN}:password::`,
            },
            {
              name: 'DATABASE_NAME',
              valueFrom: `${rds.secretARN}:dbname::`,
            },
            {
              name: 'DATABASE_PORT',
              valueFrom: `${rds.secretARN}:port::`,
            },
          ],
        },
      ],
      codeDeploy: {
        useCodeDeploy: true,
        useCodePipeline: false,
        useTerraformBasedCodeDeploy: false,
        snsNotificationTopicArn: snsTopic.arn,
        generateAppSpec: false,
        notifications: {
          //only notify on failed deploys
          notifyOnFailed: true,
          notifyOnStarted: false,
          notifyOnSucceeded: false,
        },
      },
      exposedContainer: {
        name: 'app',
        port: config.port,
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
          //This policy could probably go in the shared module in the future.
          {
            actions: ['ssm:GetParameter*'],
            resources: [
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}`,
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/*`,
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/Shared/${config.environment}/*`,
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/Shared/${config.environment}`,
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
            ],
            resources: ['*'],
            effect: 'Allow',
          },
          // {
          //   //no permission for batchReceive as we want only one message polled at a time
          //   actions: [
          //     'sqs:ReceiveMessage',
          //     'sqs:DeleteMessage',
          //     'sqs:SendMessage',
          //     'sqs:SendMessageBatch',
          //   ],
          //   resources: [sqs.sqsQueue.arn],
          //   effect: 'Allow',
          // },
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
      autoscalingConfig: {
        targetMinCapacity: config.isProd ? 2 : 1,
        targetMaxCapacity: config.isProd ? 10 : 1,
      },
      alarms: {
        //TODO: When you start using the service add the pagerduty arns as an action `pagerDuty.snsNonCriticalAlarmTopic.arn`
        http5xxErrorPercentage: {
          threshold: 25,
          evaluationPeriods: 4,
          period: 300,
          actions: config.isDev ? [] : [],
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
new NotesAPI(app, 'notes-api');
app.synth();
