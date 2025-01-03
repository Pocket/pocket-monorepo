import { config } from './config/index.ts';
import {
  provider as awsProvider,
  sqsQueue,
  cloudwatchLogGroup,
  dataAwsCallerIdentity,
  dataAwsKmsAlias,
  dataAwsRegion,
  dataAwsSnsTopic,
  dataAwsSubnets,
} from '@cdktf/provider-aws';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as archiveProvider } from '@cdktf/provider-archive';
import { provider as nullProvider } from '@cdktf/provider-null';
import {
  ApplicationRDSCluster,
  ApplicationSqsSnsTopicSubscription,
  PocketALBApplication,
  PocketAwsSyntheticChecks,
  PocketVPC,
  ApplicationServerlessRedis,
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

    const cache = this.createElasticache(this, pocketVpc);
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

    const alarmSnsTopic = this.getCodeDeploySnsTopic();

    this.createPocketAlbApplication({
      rds: this.createRds(pocketVpc),
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: alarmSnsTopic,
      region,
      caller,
      cache,
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
        // @ts-expect-error - we need to set the security group ids to undefined
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
   * Creat Aurora database
   * @param pocketVpc
   * @private
   */
  private createRds(pocketVpc: PocketVPC) {
    return new ApplicationRDSCluster(this, 'rds', {
      prefix: config.prefix,
      vpcId: pocketVpc.vpc.id,
      subnetIds: pocketVpc.privateSubnetIds,
      rdsConfig: {
        databaseName: 'shareablelists',
        masterUsername: 'pkt_slists',
        engine: 'aurora-mysql',
        engineMode: 'provisioned',
        engineVersion: '8.0.mysql_aurora.3.06.0',
        serverlessv2ScalingConfiguration: {
          minCapacity: config.rds.minCapacity,
          maxCapacity: config.rds.maxCapacity,
        },
        createServerlessV2Instance: true,
      },
      tags: config.tags,
    });
  }

  private createPocketAlbApplication(dependencies: {
    rds: ApplicationRDSCluster;
    region: dataAwsRegion.DataAwsRegion;
    caller: dataAwsCallerIdentity.DataAwsCallerIdentity;
    secretsManagerKmsAlias: dataAwsKmsAlias.DataAwsKmsAlias;
    snsTopic: dataAwsSnsTopic.DataAwsSnsTopic;
    cache: { primaryEndpoint: string; readerEndpoint: string };
  }): PocketALBApplication {
    const { rds, region, caller, secretsManagerKmsAlias, snsTopic, cache } =
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
              name: 'REDIS_PRIMARY_ENDPOINT',
              value: cache.primaryEndpoint,
            },
            {
              name: 'REDIS_READER_ENDPOINT',
              value: cache.readerEndpoint,
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
          logGroup: this.createCustomLogGroup('app'),
          logMultilinePattern: '^\\S.+',
          secretEnvVars: [
            {
              name: 'SENTRY_DSN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
            },
            {
              name: 'DATABASE_URL',
              valueFrom: `${rds.secretARN}:database_url::`,
            },
            {
              name: 'DATABASE_HOST',
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
