import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import {
  provider as awsProvider,
  dataAwsCallerIdentity,
  dataAwsRegion,
  dataAwsKmsAlias,
  dataAwsSnsTopic,
  wafv2WebAcl,
  wafv2IpSet,
} from '@cdktf/provider-aws';
import { config } from './config/index.ts';
import { PocketALBApplication } from '@pocket-tools/terraform-modules';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import { provider as pagerDutyProvider } from '@cdktf/provider-pagerduty';
import * as fs from 'fs';

class BrazeContentProxy extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
    });
    new pagerDutyProvider.PagerdutyProvider(this, 'pagerduty_provider', {
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
      wafAcl: this.createWafACL(),
    });
  }

  /**
   * Ensure that only internal IPs from the VPN or from Braze are allowed to access
   * @returns Waf ACL
   */
  private createWafACL() {
    // Braze IPs
    // We are on US-05
    // https://www.braze.com/docs/user_guide/personalization_and_dynamic_content/connected_content/making_an_api_call/#connected-content-ip-allowlisting
    const brazeIPList = [
      '23.21.118.191/32',
      '34.206.23.173/32',
      '50.16.249.9/32',
      '52.4.160.214/32',
      '54.87.8.34/32',
      '54.156.35.251/32',
      '52.54.89.238/32',
      '18.205.178.15/32',
    ];

    const allowListIPs = new wafv2IpSet.Wafv2IpSet(this, 'AllowlistIPs', {
      name: `${config.name}-${config.environment}-AllowList`,
      ipAddressVersion: 'IPV4',
      scope: 'CLOUDFRONT',
      tags: config.tags,
      addresses: brazeIPList,
    });

    const ipAllowListRule = <wafv2WebAcl.Wafv2WebAclRule>{
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

    return new wafv2WebAcl.Wafv2WebAcl(this, `${config.name}-waf`, {
      description: `Waf for ${config.name} ${config.environment} environment`,
      name: `${config.name}-waf-${config.environment}`,
      scope: 'CLOUDFRONT',
      defaultAction: { block: {} },
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: `${config.name}-waf-${config.environment}`,
        sampledRequestsEnabled: true,
      },
      rule: [ipAllowListRule],
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
    wafAcl: wafv2WebAcl.Wafv2WebAcl;
  }): PocketALBApplication {
    const { region, caller, secretsManagerKmsAlias, snsTopic, wafAcl } =
      dependencies;
    const intMaskSecretArn = `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/IntMask`;

    return new PocketALBApplication(this, 'application', {
      internal: false,
      prefix: config.prefix,
      alb6CharacterPrefix: config.shortName,
      cdn: true,
      wafConfig: {
        aclArn: wafAcl.arn,
      },
      domain: config.domain,
      containerConfigs: [
        {
          name: 'app',
          portMappings: [
            {
              hostPort: 4500,
              containerPort: 4500,
            },
          ],
          healthCheck: config.healthCheck,
          envVars: [
            {
              name: 'NODE_ENV',
              value: process.env.NODE_ENV ?? 'development',
            },
            {
              name: 'ENVIRONMENT',
              value: process.env.NODE_ENV ?? 'development', // this gives us a nice lowercase production and development
            },
          ],
          secretEnvVars: [
            {
              name: 'SENTRY_DSN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
            },
            {
              name: 'BRAZE_API_KEY',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/BRAZE_API_KEY:key::`,
            },
            {
              name: 'BRAZE_PRIVATE_KEY',
              valueFrom: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/PRIVATE_KEY:::`,
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
          notifyOnFailed: true,
          notifyOnSucceeded: false,
          notifyOnStarted: false,
        },
      },
      exposedContainer: {
        name: 'app',
        port: 4500,
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
        targetMinCapacity: 0,
        targetMaxCapacity: 0,
      },
      alarms: {
        http5xxErrorPercentage: {
          threshold: 25,
          evaluationPeriods: 4,
          period: 300,
          actions: config.isDev ? [] : [], // Disabling for now since this is not really a valid metric for a low volume service. 1 500 can cause this to alarm
        },
      },
    });
  }
}

const app = new App();
const stack = new BrazeContentProxy(app, 'braze-content-proxy');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
