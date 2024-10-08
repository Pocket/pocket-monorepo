import { config } from './config';

import {
  provider as awsProvider,
  cloudwatchLogGroup,
  dataAwsCallerIdentity,
  dataAwsRegion,
  dataAwsKmsAlias,
  dataAwsSnsTopic,
} from '@cdktf/provider-aws';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import { PocketALBApplication } from '@pocket-tools/terraform-modules';

import { App, S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import fs from 'fs';

class OTELCollector extends TerraformStack {
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

    const caller = new dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'caller',
    );
    const region = new dataAwsRegion.DataAwsRegion(this, 'region');

    const alarmTopic = this.getCodeDeploySnsTopic();

    this.createPocketAlbApplication({
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: alarmTopic,
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

    return new PocketALBApplication(this, 'application', {
      internal: true,
      prefix: config.prefix,
      alb6CharacterPrefix: config.shortName,
      tags: config.tags,
      cdn: false,
      domain: config.domain,
      taskSize: {
        cpu: 2048,
        memory: 4096,
      },
      containerConfigs: [
        {
          healthCheck: config.healthCheck,
          name: 'otel-collector',
          containerImage: 'pocket/opentelemetry-collector-contrib',
          essential: true,
          portMappings: [{ containerPort: 3000, hostPort: 3000 }],
          logMultilinePattern: '^\\S.+',
          logGroup: this.createCustomLogGroup('otel-collector'),
          envVars: [
            {
              name: 'DEPLOYMENT_ENVIRONMENT_NAME',
              value: config.tags.env_code,
            },
          ],
          secretEnvVars: [
            {
              name: 'GOOGLE_APPLICATION_CREDENTIALS_JSON',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/GCP_SA_TRACES:::`,
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
        successTerminationWaitTimeInMinutes: 5,
        notifications: {
          //only notify on failed deploys
          notifyOnFailed: true,
          notifyOnStarted: false,
          notifyOnSucceeded: false,
        },
      },
      exposedContainer: {
        name: 'otel-collector',
        port: 3000,
        healthCheckPath: '/status',
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
            ],
            effect: 'Allow',
          },
        ],
        taskRolePolicyStatements: [],
        taskExecutionDefaultAttachmentArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      autoscalingConfig: {
        targetMinCapacity: config.isProd ? 4 : 1,
        targetMaxCapacity: config.isProd ? 20 : 10,
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
const stack = new OTELCollector(app, 'otel-collector');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
