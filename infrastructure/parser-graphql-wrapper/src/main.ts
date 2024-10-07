import { config } from './config';
import { provider as archiveProvider } from '@cdktf/provider-archive';
import {
  provider as awsProvider,
  cloudwatchLogGroup,
  dataAwsCallerIdentity,
  dataAwsSnsTopic,
  dataAwsKmsAlias,
  dataAwsRegion,
  dataAwsSubnets,
} from '@cdktf/provider-aws';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import {
  ApplicationRDSCluster,
  PocketALBApplication,
  PocketVPC,
  ApplicationServerlessRedis,
  ApplicationRedis,
} from '@pocket-tools/terraform-modules';
import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import * as fs from 'fs';
import { DynamoDB } from './dynamodb';
class ParserGraphQLWrapper extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new archiveProvider.ArchiveProvider(this, 'archive_provider');
    new awsProvider.AwsProvider(this, 'aws', { region: 'us-east-1' });
    new localProvider.LocalProvider(this, 'local_provider');
    new nullProvider.NullProvider(this, 'null_provider');

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
    const vpc = new PocketVPC(this, 'pocket-vpc');

    const { primaryEndpoint, readerEndpoint } = config.isDev
      ? this.createServerlessElasticache(this, vpc)
      : this.createElasticache(this, vpc);

    const dynamodb = new DynamoDB(this, 'dynamodb');

    this.createPocketAlbApplication({
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      primaryEndpoint,
      readerEndpoint,
      region,
      caller,
      vpc,
      dynamodb,
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
    primaryEndpoint: string;
    readerEndpoint: string;
    vpc: PocketVPC;
    dynamodb: DynamoDB;
  }): PocketALBApplication {
    const {
      region,
      caller,
      secretsManagerKmsAlias,
      snsTopic,
      primaryEndpoint,
      readerEndpoint,
      vpc,
      dynamodb,
    } = dependencies;

    const PocketSharesSecretPrefix = `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:ParserWrapperApi/${config.environment}/POCKET_SHARES`;
    const PocketSecretsPrefix = `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:ParserWrapperApi/${config.environment}/SECRETS`;
    const intMaskSecretArn = `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/IntMask`;

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
      `${intMaskSecretArn}*`,
      `${intMaskSecretArn}/*`,
    ];

    let rdsCluster: ApplicationRDSCluster;
    // Set out the DB connection details for the production (legacy) database.
    if (config.isDev) {
      rdsCluster = this.createSharedUrlsRds(vpc);
      // Add Dev RDS-specific secrets if in Dev environment
      if (rdsCluster.secretARN) secretResources.push(rdsCluster.secretARN);
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
        cpu: config.isDev ? 2048 : 4096,
        memory: config.isDev ? 4096 : 8192,
      },
      containerConfigs: [
        {
          name: 'app',
          envVars: [
            {
              name: 'ENVIRONMENT',
              value: process.env.NODE_ENV ?? 'development',
            },
            {
              name: 'REDIS_PRIMARY_ENDPOINT',
              value: primaryEndpoint,
            },
            {
              name: 'REDIS_READER_ENDPOINT',
              value: readerEndpoint,
            },
            {
              name: 'REDIS_IS_CLUSTER',
              value: config.isDev ? 'true' : 'false',
            },
            {
              name: 'REDIS_IS_TLS',
              value: config.isDev ? 'true' : 'false',
            },
            {
              name: 'AWS_REGION',
              value: region.name,
            },
            {
              name: 'ITEM_SUMMARY_TABLE',
              value: dynamodb.itemSummaryTable.dynamodb.name,
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
              name: 'PARSER_BASE_ENDPOINT',
              valueFrom: `${PocketSecretsPrefix}:parser_base_endpoint::`,
            },
            {
              name: 'PARSER_DATA_PATH',
              valueFrom: `${PocketSecretsPrefix}:parser_data_path::`,
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
      codeDeploy: {
        useCodeDeploy: true,
        useCodePipeline: false,
        useTerraformBasedCodeDeploy: false,
        generateAppSpec: false,
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
              dynamodb.itemSummaryTable.dynamodb.arn,
              `${dynamodb.itemSummaryTable.dynamodb.arn}/*`,
            ],
            effect: 'Allow',
          },
        ],
        taskExecutionDefaultAttachmentArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },

      autoscalingConfig: {
        targetMinCapacity: config.environment === 'Prod' ? 8 : 1,
        targetMaxCapacity: config.environment === 'Prod' ? 20 : 10,
      },
      alarms: {
        //Triggers critical alert if 25% of request throws 5xx for
        // 4 continuous evaluation period within 20 mins (5 mins per period)
        http5xxErrorPercentage: {
          threshold: 25, //percent
          evaluationPeriods: 4,
          period: 300, //in seconds, 5 mins per period
          actions: config.isProd ? [snsTopic.arn] : [],
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
   * Creates theserverless elasticache and returns the node address list
   * @param scope
   * @private
   */
  private createServerlessElasticache(
    scope: Construct,
    pocketVPC: PocketVPC,
  ): {
    primaryEndpoint: string;
    readerEndpoint: string;
  } {
    // Serverless elasticache doesn't support the `e` availablity zone in us-east-1... so we need to filter it out..
    const privateSubnets = new dataAwsSubnets.DataAwsSubnets(
      this,
      `cache_private_subnet_ids_v2`,
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
      'serverless_redis_v2',
      {
        //Usually we would set the security group ids of the service that needs to hit this.
        //However we don't have the necessary security group because it gets created in PocketALBApplication
        //So instead we set it to null and allow anything within the vpc to access it.
        //This is not ideal..
        //Ideally we need to be able to add security groups to the ALB application.
        // @ts-expect-error - we need to allow undefined for the secruity groups
        allowedIngressSecurityGroupIds: undefined,
        subnetIds: privateSubnets.ids,
        tags: config.tags,
        vpcId: pocketVPC.vpc.id,
        // Our original redis pre-serverless only had 7GB of data, but right now we are using 125Gb
        // with a 50% cache hit rate, so lets limit it a bit to save $$.
        // Not going to limit Ecpu atm berccuase that is charged per million ecpus and we are well under the first bill number.
        // add on a serverless to the name, because our previous elasticache will still exist at the old name
        // Add back once https://github.com/hashicorp/terraform-provider-aws/issues/35897 is fixed.
        cacheUsageLimits: [{ dataStorage: [{ maximum: 7, unit: 'GB' }] }],
        prefix: `${config.prefix}-serverless-v2`,
      },
    );

    return {
      primaryEndpoint: elasticache.elasticache.endpoint.get(0).address,
      readerEndpoint: elasticache.elasticache.readerEndpoint.get(0).address,
    };
  }

  /**
   * Creates the elasticache for prod and returns the node address list
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
      // @ts-expect-error - we need to allow undefined for the secruity groups
      allowedIngressSecurityGroupIds: undefined,
      subnetIds: pocketVPC.privateSubnetIds,
      tags: config.tags,
      vpcId: pocketVPC.vpc.id,
      node: { size: 'cache.m6g.large', count: 2 },
      prefix: `${config.prefix}-reserved`,
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
        engineMode: 'provisioned',
        engineVersion: '8.0.mysql_aurora.3.06.0',
        serverlessv2ScalingConfiguration: {
          minCapacity: config.pocketSharedRds.minCapacity,
          maxCapacity: config.pocketSharedRds.maxCapacity,
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
const stack = new ParserGraphQLWrapper(app, 'parser-graphql-wrapper');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
