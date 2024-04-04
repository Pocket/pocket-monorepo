import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import {
  provider as awsProvider,
  sqsQueue,
  dataAwsCallerIdentity,
  dataAwsKmsAlias,
  dataAwsRegion,
  dataAwsSnsTopic,
  cloudwatchLogGroup,
} from '@cdktf/provider-aws';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import { provider as archiveProvider } from '@cdktf/provider-archive';
import {
  provider as pagerdutyProvider,
  dataPagerdutyEscalationPolicy,
} from '@cdktf/provider-pagerduty';
import { config } from './config';
import {
  ApplicationSQSQueue,
  PocketALBApplication,
  PocketAwsSyntheticChecks,
  PocketPagerDuty,
  PocketVPC,
  ApplicationSqsSnsTopicSubscription,
} from '@pocket-tools/terraform-modules';
import { DynamoDB } from './dynamodb';
import { SqsLambda } from './SqsLambda';

class AnnotationsAPI extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
    });
    new pagerdutyProvider.PagerdutyProvider(this, 'pagerduty_provider', {
      token: undefined,
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
    const dynamodb = new DynamoDB(this, 'dynamodb');

    const sqsLambda = new SqsLambda(
      this,
      'sqs-event-consumer',
      pocketVPC,
      region,
      caller,
    );

    const lambda = sqsLambda.lambda;

    new ApplicationSqsSnsTopicSubscription(
      this,
      'user-events-sns-subscription',
      {
        name: config.prefix,
        snsTopicArn: `arn:aws:sns:${pocketVPC.region}:${pocketVPC.accountId}:${config.lambda.snsTopicName.userEvents}`,
        sqsQueue: lambda.sqsQueueResource,
        tags: config.tags,
        dependsOn: [lambda.sqsQueueResource as sqsQueue.SqsQueue],
      },
    );

    new ApplicationSQSQueue(this, 'batch-delete-consumer-queue', {
      name: config.envVars.sqsBatchDeleteQueueName,
      tags: config.tags,
      //need to set maxReceiveCount to enable DLQ
      maxReceiveCount: 2,
    });

    const annotationsApiPagerduty = this.createPagerDuty();

    this.createPocketAlbApplication({
      pagerDuty: annotationsApiPagerduty,
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      region,
      caller,
      dynamodb,
    });

    const getAnnotationsQuery = `{"query": "query { _entities(representations: { id: \\"1\\", __typename: \\"SavedItem\\" }) { ... on SavedItem { annotations { highlights { id } } } } }"}`;

    new PocketAwsSyntheticChecks(this, 'synthetics', {
      alarmTopicArn:
        config.environment === 'Prod'
          ? annotationsApiPagerduty.snsNonCriticalAlarmTopic.arn
          : '',
      environment: config.environment,
      prefix: config.prefix,
      query: [
        {
          endpoint: config.domain,
          data: getAnnotationsQuery,
          jmespath: 'errors[0].message',
          response: 'You must be logged in to use this service', // temp response until we create canary user to make valid requests
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

  private createPocketAlbApplication(dependencies: {
    pagerDuty: PocketPagerDuty;
    region: dataAwsRegion.DataAwsRegion;
    caller: dataAwsCallerIdentity.DataAwsCallerIdentity;
    secretsManagerKmsAlias: dataAwsKmsAlias.DataAwsKmsAlias;
    snsTopic: dataAwsSnsTopic.DataAwsSnsTopic;
    dynamodb: DynamoDB;
  }): PocketALBApplication {
    const { region, caller, secretsManagerKmsAlias, snsTopic, dynamodb } =
      dependencies;

    const databaseSecretsArn = `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/READITLA_DB`;

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
              value: process.env.NODE_ENV,
            },
            {
              name: 'ENVIRONMENT',
              value: process.env.NODE_ENV, // this gives us a nice lowercase production and development
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
              name: 'DATABASE_TZ',
              value: config.envVars.databaseTz,
            },
            {
              name: 'AWS_REGION',
              value: region.name,
            },
            {
              name: 'HIGHLIGHT_NOTES_TABLE',
              value: dynamodb.highlightNotesTable.dynamodb.name,
            },
            {
              name: 'HIGHLIGHT_NOTES_KEY',
              value: config.dynamodb.notesTable.key,
            },
            {
              name: 'HIGHLIGHT_NOTES_NOTE',
              value: config.dynamodb.notesTable.note,
            },
            {
              name: 'SQS_BATCH_DELETE_QUEUE_URL',
              value: `https://sqs.${region.name}.amazonaws.com/${caller.accountId}/${config.envVars.sqsBatchDeleteQueueName}`,
            },
            {
              name: 'OTLP_COLLECTOR_HOST',
              value: config.tracing.host,
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
              name: 'DATABASE_READ_HOST',
              valueFrom: `${databaseSecretsArn}:read_host::`,
            },
            {
              name: 'DATABASE_READ_USER',
              valueFrom: `${databaseSecretsArn}:read_username::`,
            },
            {
              name: 'DATABASE_READ_PASSWORD',
              valueFrom: `${databaseSecretsArn}:read_password::`,
            },
            {
              name: 'DATABASE_WRITE_HOST',
              valueFrom: `${databaseSecretsArn}:write_host::`,
            },
            {
              name: 'DATABASE_WRITE_USER',
              valueFrom: `${databaseSecretsArn}:write_username::`,
            },
            {
              name: 'DATABASE_WRITE_PASSWORD',
              valueFrom: `${databaseSecretsArn}:write_password::`,
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
            actions: [
              'dynamodb:BatchGet*',
              'dynamodb:DescribeTable',
              'dynamodb:Get*',
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:UpdateItem',
              'dynamodb:BatchWrite*',
              'dynamodb:Delete*',
              'dynamodb:PutItem',
            ],
            resources: [
              dynamodb.highlightNotesTable.dynamodb.arn,
              `${dynamodb.highlightNotesTable.dynamodb.arn}/*`,
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
new AnnotationsAPI(app, 'annotations-api');
app.synth();
