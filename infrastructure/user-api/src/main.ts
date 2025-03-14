import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import {
  provider as awsProvider,
  cloudwatchLogGroup,
  dataAwsCallerIdentity,
  dataAwsKmsAlias,
  dataAwsRegion,
  dataAwsSnsTopic,
} from '@cdktf/provider-aws';
import { config } from './config/index.ts';
import {
  PocketALBApplication,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import * as fs from 'fs';

class UserAPI extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

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

    new PocketVPC(this, 'pocket-vpc');
    const region = new dataAwsRegion.DataAwsRegion(this, 'region');
    const caller = new dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'caller',
    );

    this.createPocketAlbApplication({
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      region,
      caller,
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
  }): PocketALBApplication {
    const { region, caller, secretsManagerKmsAlias, snsTopic } = dependencies;

    const databaseSecretsArn = `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/READITLA_DB`;
    const intMaskSecretArn = `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/IntMask`;

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
              hostPort: 4006,
              containerPort: 4006,
            },
          ],
          healthCheck: {
            command: [
              'CMD-SHELL',
              'curl -f http://localhost:4006/.well-known/apollo/server-health || exit 1',
            ],
            interval: 15,
            retries: 3,
            timeout: 5,
            startPeriod: 0,
          },
          envVars: [
            {
              name: 'OTLP_COLLECTOR_URL',
              value: config.tracing.url,
            },
            {
              name: 'NODE_ENV',
              value: process.env.NODE_ENV ?? 'development',
            },
            {
              name: 'DATABASE_READ_PORT',
              value: config.database.port,
            },
            {
              name: 'DATABASE_WRITE_PORT',
              value: config.database.port,
            },
            {
              name: 'EVENT_BUS_NAME',
              value: config.envVars.eventBusName,
            },
          ],
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
            {
              name: 'CONTACT_HASH',
              valueFrom: `${intMaskSecretArn}:contactHash::`,
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
          logGroup: this.createCustomLogGroup('app'),
          logMultilinePattern: '^\\S.+',
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
        port: 4006,
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
          {
            actions: ['events:PutEvents'],
            resources: [
              `arn:aws:events:${region.name}:${caller.accountId}:event-bus/${config.envVars.eventBusName}`,
            ],
            effect: 'Allow',
          },
        ],
        taskExecutionDefaultAttachmentArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      autoscalingConfig: {
        targetMinCapacity: config.environment === 'Prod' ? 3 : 1,
        targetMaxCapacity: config.environment === 'Prod' ? 10 : 1,
      },
      alarms: {
        //TODO: When we start using this more we will change from non-critical to critical
        http5xxErrorPercentage: {
          // This will go off if the 5xx errors exceed 25% of the total request over
          // a period of 20 minutes after 4 evaluation periods of 5 mins each.
          threshold: 25, // This is a percentage
          evaluationPeriods: 4,
          period: 300, // 5 mins
          actions: config.isDev ? [] : [snsTopic.arn],
        },
        httpLatency: {
          // If the latency is greater than 150 ms for 1 hour continuously i.e
          // breaches the threshold 4 times every 15 minutes,
          // this will go off
          period: 900,
          evaluationPeriods: 4,
          threshold: 0.15,
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

const app = new App();
const stack = new UserAPI(app, 'user-api');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
