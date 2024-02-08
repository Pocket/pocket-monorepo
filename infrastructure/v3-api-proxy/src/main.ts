import { Construct } from 'constructs';
import {
  App,
  DataTerraformRemoteState,
  RemoteBackend,
  TerraformStack,
} from 'cdktf';
import { AwsProvider, kms, datasources, sns } from '@cdktf/provider-aws';
import { config } from './config';
import {
  PocketALBApplication,
  PocketECSCodePipeline,
  PocketPagerDuty,
} from '@pocket-tools/terraform-modules';
import { PagerdutyProvider } from '@cdktf/provider-pagerduty';
import { LocalProvider } from '@cdktf/provider-local';
import { NullProvider } from '@cdktf/provider-null';
import * as fs from 'fs';

class Stack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, 'aws', { region: 'us-east-1' });
    new PagerdutyProvider(this, 'pagerduty_provider', { token: undefined });
    new LocalProvider(this, 'local_provider');
    new NullProvider(this, 'null_provider');

    new RemoteBackend(this, {
      hostname: 'app.terraform.io',
      organization: 'Pocket',
      workspaces: [{ prefix: `${config.name}-` }],
    });

    const region = new datasources.DataAwsRegion(this, 'region');
    const caller = new datasources.DataAwsCallerIdentity(this, 'caller');

    const pocketApp = this.createPocketAlbApplication({
      pagerDuty: this.createPagerDuty(),
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      region,
      caller,
    });

    this.createApplicationCodePipeline(pocketApp);
  }

  /**
   * Get the sns topic for code deploy
   * @private
   */
  private getCodeDeploySnsTopic() {
    return new sns.DataAwsSnsTopic(this, 'backend_notifications', {
      name: `Backend-${config.environment}-ChatBot`,
    });
  }

  /**
   * Get secrets manager kms alias
   * @private
   */
  private getSecretsManagerKmsAlias() {
    return new kms.DataAwsKmsAlias(this, 'kms_alias', {
      name: 'alias/aws/secretsmanager',
    });
  }

  /**
   * Create CodePipeline to build and deploy terraform and ecs
   * @param app
   * @private
   */
  private createApplicationCodePipeline(app: PocketALBApplication) {
    new PocketECSCodePipeline(this, 'code-pipeline', {
      prefix: config.prefix,
      source: {
        codeStarConnectionArn: config.codePipeline.githubConnectionArn,
        repository: config.codePipeline.repository,
        branchName: config.codePipeline.branch,
      },
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

    const incidentManagement = new DataTerraformRemoteState(
      this,
      'incident_management',
      {
        organization: 'Pocket',
        workspaces: {
          name: 'incident-management',
        },
      }
    );

    return new PocketPagerDuty(this, 'pagerduty', {
      prefix: config.prefix,
      service: {
        criticalEscalationPolicyId: incidentManagement
          .get('policy_default_critical_id')
          .toString(),
        nonCriticalEscalationPolicyId: incidentManagement
          .get('policy_default_non_critical_id')
          .toString(),
      },
    });
  }

  /**
   * method to set up ALB, ECS cluster, relevant IAM permissions,
   * and inject environment variables for ecs
   * @param dependencies
   * @private
   */
  private createPocketAlbApplication(dependencies: {
    pagerDuty: PocketPagerDuty;
    region: datasources.DataAwsRegion;
    caller: datasources.DataAwsCallerIdentity;
    secretsManagerKmsAlias: kms.DataAwsKmsAlias;
    snsTopic: sns.DataAwsSnsTopic;
  }): PocketALBApplication {
    const {
      //  pagerDuty, // enable if necessary
      region,
      caller,
      secretsManagerKmsAlias,
      snsTopic,
    } = dependencies;

    return new PocketALBApplication(this, 'application', {
      // TODO: "internal: true" deploys service behind VPN, set false or remove this comment
      internal: true,
      prefix: config.prefix,
      alb6CharacterPrefix: config.shortName,
      tags: config.tags,
      cdn: false,
      domain: config.domain,
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
          ],
          secretEnvVars: [
            {
              name: 'SENTRY_DSN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
            },
          ],
        },
        {
          //todo: change to opentelemetry in followup PR
          name: 'xray-daemon',
          containerImage: 'public.ecr.aws/xray/aws-xray-daemon:latest',
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
        useCodePipeline: true,
        notifications: {
          notifyOnFailed: true,
          notifyOnStarted: false,
          notifyOnSucceeded: false,
        },
        snsNotificationTopicArn: snsTopic.arn,
      },
      exposedContainer: {
        name: 'app',
        port: config.port,
        healthCheckPath: '/.well-known/server-health',
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
        targetMaxCapacity: 10,
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
}

const app = new App();
const stack = new Stack(app, `${config.domainPrefix}`);
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
