import {
  provider as awsProvider,
  dataAwsCallerIdentity,
  dataAwsRegion,
  dataAwsKmsAlias,
  dataAwsSnsTopic,
} from '@cdktf/provider-aws';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import { provider as pagerdutyProvider } from '@cdktf/provider-pagerduty';
import {
  ApplicationRDSCluster,
  PocketALBApplication,
  PocketPagerDuty,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import fs from 'fs';
import { config } from './config';

class FeatureFlags extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new awsProvider.AwsProvider(this, 'aws', { region: 'us-east-1' });

    new pagerdutyProvider.PagerdutyProvider(this, 'pagerduty_provider', {
      token: undefined,
    });

    new localProvider.LocalProvider(this, 'local_provider');
    new nullProvider.NullProvider(this, 'null_provider');

    new S3Backend(this, {
      bucket: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      dynamodbTable: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      key: config.name,
      region: 'us-east-1',
    });

    const pocketVpc = new PocketVPC(this, 'pocket-vpc');
    const region = new dataAwsRegion.DataAwsRegion(this, 'region');
    const caller = new dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'caller',
    );

    this.createPocketAlbApplication({
      rds: this.createRds(pocketVpc),
      pagerDuty: this.createPagerDuty(),
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
      useName: false,
      rdsConfig: {
        databaseName: 'featureflags',
        masterUsername: 'pkt_fflags',
        engine: 'aurora-postgresql',
        engineMode: 'serverless',
        scalingConfiguration: {
          minCapacity: config.rds.minCapacity,
          maxCapacity: config.rds.maxCapacity,
          autoPause: false,
        },
      },

      tags: config.tags,
    });
  }

  /**
   * Create PagerDuty service for alerts
   * @private
   */
  private createPagerDuty(): PocketPagerDuty | undefined {
    // Don't create pagerduty services for a dev service.
    return null;

    // const incidentManagement = new DataTerraformRemoteState(
    //   this,
    //   'incident_management',
    //   {
    //     organization: 'Pocket',
    //     workspaces: {
    //       name: 'incident-management',
    //     },
    //   }
    // );

    // return new PocketPagerDuty(this, 'pagerduty', {
    //   prefix: config.prefix,
    //   service: {
    //     criticalEscalationPolicyId: incidentManagement
    //       .get('policy_backend_critical_id')
    //       .toString(),
    //     nonCriticalEscalationPolicyId: incidentManagement
    //       .get('policy_backend_non_critical_id')
    //       .toString(),
    //   },
    // });
  }

  private createPocketAlbApplication(dependencies: {
    rds: ApplicationRDSCluster;
    pagerDuty: PocketPagerDuty;
    region: dataAwsRegion.DataAwsRegion;
    caller: dataAwsCallerIdentity.DataAwsCallerIdentity;
    secretsManagerKmsAlias: dataAwsKmsAlias.DataAwsKmsAlias;
    snsTopic: dataAwsSnsTopic.DataAwsSnsTopic;
  }): PocketALBApplication {
    const { rds, region, caller, secretsManagerKmsAlias, snsTopic } =
      dependencies;

    return new PocketALBApplication(this, 'application', {
      internal: false,
      prefix: config.prefix,
      alb6CharacterPrefix: config.shortName,
      tags: config.tags,
      cdn: false,
      domain: config.domain,
      containerConfigs: [
        {
          name: 'app',
          imageSha: config.releaseSha,
          portMappings: [
            {
              hostPort: 4242,
              containerPort: 4242,
            },
          ],
          healthCheck: {
            command: [
              'CMD-SHELL',
              'curl -f http://localhost:4242/.well-known/apollo/server-health || exit 1',
            ],
            interval: 15,
            retries: 3,
            timeout: 5,
            startPeriod: 0,
          },
          envVars: [
            {
              name: 'NODE_ENV',
              value: process.env.NODE_ENV, // this gives us a nice lowercase production and development
            },
          ],
          secretEnvVars: [
            {
              name: 'SENTRY_DSN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
            },
            {
              name: 'DB_HOST',
              valueFrom: `${rds.secretARN}:host::`,
            },
            {
              name: 'DB_PORT',
              valueFrom: `${rds.secretARN}:port::`,
            },
            {
              name: 'DB_USERNAME',
              valueFrom: `${rds.secretARN}:username::`,
            },
            {
              name: 'DB_PASSWORD',
              valueFrom: `${rds.secretARN}:password::`,
            },
            {
              name: 'DB_NAME',
              valueFrom: `${rds.secretARN}:dbname::`,
            },
            {
              name: 'CLIENT_ID',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/OAuthCredentials:clientId::`,
            },
            {
              name: 'CLIENT_SECRET',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/OAuthCredentials:clientSecret::`,
            },
            {
              name: 'CALLBACK_URL',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/OAuthCredentials:callbackURL::`,
            },
            {
              name: 'AUTH_URL',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/OAuthCredentials:authorizationURL::`,
            },
            {
              name: 'TOKEN_URL',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/OAuthCredentials:tokenURL::`,
            },
            {
              name: 'USER_INFO_URL',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/OAuthCredentials:userInfoURL::`,
            },
            {
              name: 'ISSUER_URL',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/OAuthCredentials:issuer::`,
            },
          ],
        },
        {
          name: 'xray-daemon',
          containerImage: 'amazon/aws-xray-daemon',
          repositoryCredentialsParam: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/DockerHub`,
          portMappings: [
            {
              hostPort: 2000,
              containerPort: 2000,
              protocol: 'udp',
            },
          ],
          command: ['--region', 'us-east-1', '--local-mode'],
        },
      ],
      codeDeploy: {
        useCodeDeploy: true,
        useCodePipeline: false,
        useTerraformBasedCodeDeploy: false,
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
        port: 4242,
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
        targetMinCapacity: 2,
        targetMaxCapacity: 12,
      },
      alarms: {
        // alarms if >= 25% of responses are 5xx over 20 minutes
        // http5xxErrorPercentage: {
        //   threshold: 25, // 25%
        //   period: 300, // 5 minutes
        //   evaluationPeriods: 4, // 20 minutes total
        //   actions: config.isDev ? [] : [pagerDuty.snsCriticalAlarmTopic.arn],
        // },
      },
    });
  }
}

const app = new App();
const stack = new FeatureFlags(app, 'feature-flags');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
