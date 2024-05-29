import { config } from './config';

import {
  provider as awsProvider,
  cloudwatchLogGroup,
  dataAwsCallerIdentity,
  dataAwsRegion,
  dataAwsKmsAlias,
  dataAwsSnsTopic,
  dataAwsSubnets,
} from '@cdktf/provider-aws';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import {
  provider as pagerdutyProvider,
  dataPagerdutyEscalationPolicy,
} from '@cdktf/provider-pagerduty';
import {
  PocketALBApplication,
  PocketPagerDuty,
  PocketAwsSyntheticChecks,
  ApplicationServerlessRedis,
  PocketVPC,
} from '@pocket-tools/terraform-modules';

import { App, S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import fs from 'fs';


import { Wafv2IpSet } from '@cdktf/provider-aws/lib/wafv2-ip-set';
import {
  Wafv2WebAclRule,
  Wafv2WebAcl,
  Wafv2WebAclAssociationConfig,
} from '@cdktf/provider-aws/lib/wafv2-web-acl';
import { Wafv2WebAclAssociation } from '@cdktf/provider-aws/lib/wafv2-web-acl-association';
class ClientAPI extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
    });
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

    const caller = new dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'caller',
    );
    const region = new dataAwsRegion.DataAwsRegion(this, 'region');

    const clientApiPagerduty = this.createPagerDuty();
    const pocketVPC = new PocketVPC(this, 'pocket-vpc');
    const cache = this.createElasticache(this, pocketVPC);

    this.createPocketAlbApplication({
      pagerDuty: clientApiPagerduty,
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      cache,
      region,
      caller,
    });

    this.createWafACL()

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
  }

  private createWafACL() {
    const ipListProd = [
      '54.198.114.156/32', // Pocket Nat Gateway; ID: nat-099e4c60ff22e3827
      '52.54.7.21/32', // Pocket Nat Gateway; ID: nat-041b98cf5532a39b3
      '34.226.66.3/32', // Pocket Nat Gateway; ID: nat-038b7eb1d10a3e2aa
      '52.0.226.89/32', // Pocket Nat Gateway; ID: nat-05ecc05c40f383455
    ];

    const ipListDev = [
      '34.233.86.222/32', // Pocket Nat Gateway; ID: nat-06a8c51b7f3d76caa
      '52.202.17.168/32', // Pocket Nat Gateway; ID: nat-0a0c2993503052dfa
      '3.227.50.158/32', // Pocket Nat Gateway; ID: nat-012b70612d4ab16d1
      '18.233.131.213/32', // Pocket Nat Gateway; ID: nat-0134b5e5f600ca800
    ];

    const ipList = config.environment === 'Prod' ? ipListProd : ipListDev;

    const allowListIPs = new Wafv2IpSet(this, 'AllowlistIPs', {
      name: `${config.name}-${config.environment}-AllowList`,
      ipAddressVersion: 'IPV4',
      scope: 'REGIONAL',
      tags: config.tags,
      addresses: ipList,
    });

    const ipAllowListRule = <Wafv2WebAclRule>{
      name: `${config.name}-${config.environment}-ipAllowList`,
      priority: 1,
      action: { allow: {} },
      statement: {
        ip_set_reference_statement: {
          arn: allowListIPs.arn,
        },
      },
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: `${config.name}-${config.environment}-ipAllowList`,
        sampledRequestsEnabled: true,
      },
    };

    const regionalRateLimitRule = <Wafv2WebAclRule>{
      name: `${config.name}-${config.environment}-RegionalRateLimit`,
      priority: 2,
      action: { block: {} },
      statement: {
        rate_based_statement: {
          limit: 1000,
          aggregate_key_type: 'IP',
        },
      },
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: `${config.name}-${config.environment}-RegionalRateLimit`,
        sampledRequestsEnabled: true,
      },
    };

    return new Wafv2WebAcl(this, `${config.name}-waf`, {
      description: `Waf for client-api-proxy ${config.environment} environment`,
      name: `${config.name}-waf-${config.environment}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: `${config.name}-waf-${config.environment}`,
        sampledRequestsEnabled: true,
      },
      rule: [ipAllowListRule, regionalRateLimitRule],
    });
  };

  private createWAF(alb: ApplicationLoadBalancer, webAclArn: string) {
    new Wafv2WebAclAssociation(this, 'application_waf_association', {
      webAclArn: webAclArn,
      resourceArn: alb.alb.arn,
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
  private createPagerDuty(): PocketPagerDuty | undefined {
    if (config.isDev) {
      //Dont create pagerduty services for a dev service.
      return null;
    }

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
    pagerDuty?: PocketPagerDuty;
    region: dataAwsRegion.DataAwsRegion;
    caller: dataAwsCallerIdentity.DataAwsCallerIdentity;
    secretsManagerKmsAlias: dataAwsKmsAlias.DataAwsKmsAlias;
    snsTopic: dataAwsSnsTopic.DataAwsSnsTopic;
    cache: string;
    wafAcl: Wafv2WebAcl;
  }): PocketALBApplication {
    const {
      pagerDuty,
      region,
      caller,
      secretsManagerKmsAlias,
      cache,
      snsTopic,
      wafAcl,
    } = dependencies;

    return new PocketALBApplication(this, 'application', {
      internal: false,
      prefix: config.prefix,
      alb6CharacterPrefix: config.shortName,
      tags: config.tags,
      cdn: true,
      domain: config.domain,
      wafConfig: {
        aclArn: wafAcl.arn,
      },
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
              name: 'REDIS_ENDPOINT',
              value: cache,
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
   * Creates the elasticache and returns the endpoints
   * @param scope
   * @private
   */
  private createElasticache(scope: Construct, pocketVPC: PocketVPC): string {
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
        allowedIngressSecurityGroupIds: undefined,
        subnetIds: privateSubnets.ids,
        tags: config.tags,
        vpcId: pocketVPC.vpc.id,
        // add on a serverless to the name, because our previous elasticache will still exist at the old name
        prefix: `${config.prefix}-serverless`,
      },
    );

    return elasticache.elasticache.endpoint.get(0).address;
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
const stack = new ClientAPI(app, 'client-api');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
