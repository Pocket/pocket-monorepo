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
  provider as pagerdutyProvider,
  dataPagerdutyEscalationPolicy,
} from '@cdktf/provider-pagerduty';
import {
  ApplicationRDSCluster,
  PocketALBApplication,
  PocketPagerDuty,
  PocketVPC,
  ApplicationServerlessRedis,
  ApplicationRedis,
} from '@pocket-tools/terraform-modules';
import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import * as fs from 'fs';
class ParserGraphQLWrapper extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new archiveProvider.ArchiveProvider(this, 'archive_provider');
    new awsProvider.AwsProvider(this, 'aws', { region: 'us-east-1' });
    new localProvider.LocalProvider(this, 'local_provider');
    new nullProvider.NullProvider(this, 'null_provider');
    new pagerdutyProvider.PagerdutyProvider(this, 'pagerduty_provider', {
      token: undefined,
    });

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

    this.createPocketAlbApplication({
      pagerDuty: this.createPagerDuty(),
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      primaryEndpoint,
      readerEndpoint,
      region,
      caller,
      vpc,
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
    const mozillaEscalation =
      new dataPagerdutyEscalationPolicy.DataPagerdutyEscalationPolicy(
        this,
        'mozilla_sre_escalation_policy',
        {
          name: 'IT SRE: Escalation Policy',
        },
      );

    return new PocketPagerDuty(this, 'pagerduty', {
      prefix: config.prefix,
      service: {
        criticalEscalationPolicyId: mozillaEscalation.id,
        nonCriticalEscalationPolicyId: mozillaEscalation.id,
      },
    });
  }

  private createPocketAlbApplication(dependencies: {
    pagerDuty: PocketPagerDuty;
    region: dataAwsRegion.DataAwsRegion;
    caller: dataAwsCallerIdentity.DataAwsCallerIdentity;
    secretsManagerKmsAlias: dataAwsKmsAlias.DataAwsKmsAlias;
    snsTopic: dataAwsSnsTopic.DataAwsSnsTopic;
    primaryEndpoint: string;
    readerEndpoint: string;
    vpc: PocketVPC;
  }): PocketALBApplication {
    const {
      pagerDuty,
      region,
      caller,
      secretsManagerKmsAlias,
      snsTopic,
      primaryEndpoint,
      readerEndpoint,
      vpc,
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
      secretResources.push(rdsCluster.secretARN);
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
        cpu: 2048,
        memory: 4096,
      },
      containerConfigs: [
        {
          name: 'app',
          envVars: [
            {
              name: 'ENVIRONMENT',
              value: process.env.NODE_ENV,
            },
            {
              name: 'OTLP_COLLECTOR_HOST',
              value: config.tracing.host,
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
              name: 'PARSER_URL',
              valueFrom: `${PocketSecretsPrefix}:parser_endpoint::`,
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
        ],
        taskExecutionDefaultAttachmentArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },

      autoscalingConfig: {
        targetMinCapacity: config.environment === 'Prod' ? 4 : 2,
        targetMaxCapacity: config.environment === 'Prod' ? 10 : 10,
      },
      alarms: {
        //Triggers critical alert if 25% of request throws 5xx for
        // 4 continuous evaluation period within 20 mins (5 mins per period)
        http5xxErrorPercentage: {
          threshold: 25, //percent
          evaluationPeriods: 4,
          period: 300, //in seconds, 5 mins per period
          actions: config.isProd ? [pagerDuty.snsCriticalAlarmTopic.arn] : [],
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
        engineMode: 'serverless',
        scalingConfiguration: {
          minCapacity: config.pocketSharedRds.minCapacity,
          maxCapacity: config.pocketSharedRds.maxCapacity,
          autoPause: false,
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
