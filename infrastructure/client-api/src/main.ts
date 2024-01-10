import { config } from './config';

import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsKmsAlias } from '@cdktf/provider-aws/lib/data-aws-kms-alias';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DataAwsSnsTopic } from '@cdktf/provider-aws/lib/data-aws-sns-topic';
import { LocalProvider } from '@cdktf/provider-local/lib/provider';
import { NullProvider } from '@cdktf/provider-null/lib/provider';
import { PagerdutyProvider } from '@cdktf/provider-pagerduty/lib/provider';
import { DataPagerdutyEscalationPolicy } from '@cdktf/provider-pagerduty/lib/data-pagerduty-escalation-policy';
import {
  ApplicationMemcache,
  PocketALBApplication,
  PocketVPC,
  PocketPagerDuty,
  PocketAwsSyntheticChecks,
} from '@pocket-tools/terraform-modules';

import { App, RemoteBackend, TerraformStack, MigrateIds, Aspects } from 'cdktf';
import { Construct } from 'constructs';
import fs from 'fs';

class ClientAPI extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, 'aws', { region: 'us-east-1' });
    new LocalProvider(this, 'local_provider');
    new NullProvider(this, 'null_provider');
    new PagerdutyProvider(this, 'pagerduty_provider', { token: undefined });
    new RemoteBackend(this, {
      hostname: 'app.terraform.io',
      organization: 'Pocket',
      workspaces: [{ name: `${config.name}-${config.environment}` }],
    });

    const caller = new DataAwsCallerIdentity(this, 'caller');
    const region = new DataAwsRegion(this, 'region');

    const clientApiPagerduty = this.createPagerDuty();
    this.createPocketAlbApplication({
      pagerDuty: clientApiPagerduty,
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      nodeList: this.createElasticache(),
      region,
      caller,
    });

    new PocketAwsSyntheticChecks(this, 'synthetics', {
      // alarmTopicArn:
      //   config.environment === 'Prod'
      //     ? clientApiPagerduty.snsCriticalAlarmTopic.arn // Tier 1
      //     : '',
      environment: config.environment,
      prefix: config.prefix,
      query: [],
      shortName: config.shortName,
      tags: config.tags,
      uptime: [
        {
          response: '{"status":"UP"}',
          url: `${config.domain}/.well-known/apollo/server-health`,
        },
      ],
    });

    // Pre cdktf 0.17 ids were generated differently so we need to apply a migration aspect
    // https://developer.hashicorp.com/terraform/cdktf/concepts/aspects
    Aspects.of(this).add(new MigrateIds());
  }

  /**
   * Get the sns topic for code deploy
   * @private
   */
  private getCodeDeploySnsTopic() {
    return new DataAwsSnsTopic(this, 'backend_notifications', {
      name: `Backend-${config.environment}-ChatBot`,
    });
  }

  /**
   * Get secrets manager kms alias
   * @private
   */
  private getSecretsManagerKmsAlias() {
    return new DataAwsKmsAlias(this, 'kms_alias', {
      name: 'alias/aws/secretsmanager',
    });
  }

  /**
   * Create PagerDuty service for alerts
   * @private
   */
  private createPagerDuty(): PocketPagerDuty | undefined {
    if (config.isDev) {
      //Dont create pagerduty services for a dev service.
      return null;
    }

    const mozillaEscalation = new DataPagerdutyEscalationPolicy(
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
    pagerDuty?: PocketPagerDuty;
    region: DataAwsRegion;
    caller: DataAwsCallerIdentity;
    secretsManagerKmsAlias: DataAwsKmsAlias;
    snsTopic: DataAwsSnsTopic;
    nodeList: string[];
  }): PocketALBApplication {
    const { pagerDuty, region, caller, secretsManagerKmsAlias, snsTopic } =
      dependencies;

    return new PocketALBApplication(this, 'application', {
      internal: false,
      prefix: config.prefix,
      alb6CharacterPrefix: config.shortName,
      tags: config.tags,
      cdn: true,
      domain: config.domain,
      taskSize: {
        cpu: 1024,
        memory: 2048,
      },
      accessLogs: {
        existingBucket: config.s3LogsBucket,
      },
      containerConfigs: [
        {
          name: 'app',
          portMappings: [
            {
              hostPort: 4001,
              containerPort: 4001,
              protocol: 'tcp',
            },
          ],
          envVars: [
            {
              name: 'PORT',
              value: '4001',
            },
            {
              name: 'APOLLO_GRAPH_REF',
              value: `${config.envVars.graph.graphId}@${config.envVars.graph.graphVariant}`,
            },
            {
              name: 'APP_ENVIRONMENT',
              value: config.isProd ? 'production' : 'development',
            },
            {
              name: 'OTLP_COLLECTOR_HOST',
              value: `${config.tracing.host}`,
            },
            {
              name: 'RELEASE_SHA',
              value:
                process.env.CODEBUILD_RESOLVED_SOURCE_VERSION ??
                process.env.CIRCLE_SHA1,
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
              name: 'APOLLO_KEY',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/APOLLO_KEY`,
            },
          ],
          healthCheck: {
            command: [
              'CMD-SHELL',
              'curl -f http://localhost:4001/.well-known/apollo/server-health || exit 1',
            ],
            interval: 15,
            retries: 3,
            timeout: 5,
            startPeriod: 0,
          },
        },
        {
          name: 'aws-otel-collector',
          containerImage: 'amazon/aws-otel-collector',
          essential: true,
          repositoryCredentialsParam: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/DockerHub`,
          //Used default config as stated here:
          // Available configs here: - https://github.com/aws-observability/aws-otel-collector/tree/main/config
          command: [
            '--config=/etc/ecs/ecs-xray.yaml',
            //enable for debugging
            //'--set=service.telemetry.logs.level=debug',
          ],
          logGroup: this.createCustomLogGroup('aws-otel-collector'),
          logMultilinePattern: '^\\S.+',
          portMappings: [
            {
              //default http port
              hostPort: 4138,
              containerPort: 4138,
            },
            {
              //default grpc port
              hostPort: 4137,
              containerPort: 4137,
            },
          ],
        },
      ],
      codeDeploy: {
        useCodeDeploy: true,
        useCodePipeline: false,
        useTerraformBasedCodeDeploy: false,
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
            resources: [
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/*`,
              secretsManagerKmsAlias.targetKeyArn,
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
        targetMinCapacity: config.isProd ? 4 : 2,
        targetMaxCapacity: config.isProd ? 20 : 10,
      },
      alarms: {
        http5xxErrorPercentage: {
          //Triggers critical alert if 50% of request throws 5xx for
          // 4 continuous evaluation period for 20 mins (5 mins per period)
          threshold: 50,
          evaluationPeriods: 4,
          period: 300, //in seconds, 5 mins per period
          actions: config.isProd ? [pagerDuty.snsCriticalAlarmTopic.arn] : [],
          // TODO: Dead link
          alarmDescription:
            'Runbook: https://getpocket.atlassian.net/l/c/khqp5x57',
        },
        httpLatency: {
          //Triggers non-critical alert if latency is above 500ms
          // for 4 continuous evaluation period for 1 hour (15 mins per period)
          evaluationPeriods: 4,
          threshold: 500,
          period: 900, //in seconds, 15 mins per period
          actions: config.isProd
            ? [pagerDuty.snsNonCriticalAlarmTopic.arn]
            : [],
          alarmDescription:
            // TODO: Dead link
            'Runbook: https://getpocket.atlassian.net/l/c/YnDN190b',
        },
      },
    });
  }

  /**
   * Creates the elasticache and returns the node address list
   * @param scope
   * @private
   */
  private createElasticache(): string[] {
    const pocketVPC = new PocketVPC(this, 'pocket-vpc');

    // TODO (@kschelonka): Change this to redis and configure router.yaml
    // https://mozilla-hub.atlassian.net/browse/POCKET-9467
    // https://www.apollographql.com/docs/router/configuration/distributed-caching/
    const elasticache = new ApplicationMemcache(this, 'memcached', {
      //Usually we would set the security group ids of the service that needs to hit this.
      //However we don't have the necessary security group because it gets created in PocketALBApplication
      //So instead we set it to null and allow anything within the vpc to access it.
      //This is not ideal..
      //Ideally we need to be able to add security groups to the ALB application.
      allowedIngressSecurityGroupIds: undefined,
      node: {
        count: config.cacheNodes,
        size: config.cacheSize,
      },
      subnetIds: pocketVPC.privateSubnetIds,
      tags: config.tags,
      vpcId: pocketVPC.vpc.id,
      prefix: config.prefix,
    });

    // eslint-disable-next-line prefer-const
    let nodeList: string[] = [];
    for (let i = 0; i < config.cacheNodes; i++) {
      // ${elasticache.elasticacheClister.cacheNodes(i.toString()).port} has a bug and is not rendering the proper terraform address
      // its rendering -1.8881545897087503e+289 for some weird reason...
      // For now we just hardcode to 11211 which is the default memcache port.
      nodeList.push(
        `${elasticache.elasticacheCluster.cacheNodes.get(i).address}:11211`,
      );
    }
    return nodeList;
  }

  /**
   * Create Custom log group for ECS to share across task revisions
   * @param containerName
   * @private
   */
  private createCustomLogGroup(containerName: string) {
    const logGroup = new CloudwatchLogGroup(
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
const stack = new ClientAPI(app, 'client-api');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
