// Use this module over PocketSynthetics.ts when checks need to be inside a Pocket VPC.
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { SyntheticsCanary } from '@cdktf/provider-aws/lib/synthetics-canary';
import { Construct } from 'constructs';

/**
 *
 * Query Configs are used for Synthetics to make POST requests,
 * then check the expected response, optionally at a JMESPath node
 * in the response body. (see https://jmespath.org/ if unfamililar).
 * Built for GraphQL operation checks, but can be used for any POST.
 *
 */
interface PocketAwsSyntheticQueryConfig {
  data?: string;
  userId?: string;
  endpoint?: string;
  jmespath?: string;
  response?: string;
}

/**
 *
 * Uptime Configs are used for Synthetics to make GET requests,
 * then check the response code is 2XX,
 * & optionally check an expected response body (no parsing).
 *
 */
interface PocketAwsSyntheticUptimeConfig {
  response?: string;
  url?: string;
}

/**
 *
 * This is the config interface for both uptime & query checks (see above).
 * Arrays of each can be passed in (or not), for as many endpoints to check
 * as desired. TBD: make each endpoint differently configurable for alerting
 * (all checks using this module will alert via 1 shared action currently).
 *
 */
export interface PocketAwsSyntheticCheckProps {
  alarmTopicArn?: string | null;
  environment: string; // reusable code setup only exists in AWS Dev & Prod Accounts currently.
  prefix: string;
  query: PocketAwsSyntheticQueryConfig[];
  securityGroupIds?: string[];
  shortName: string;
  subnetIds?: string[];
  tags?: { [key: string]: string };
  uptime: PocketAwsSyntheticUptimeConfig[];
}

/**
 *
 * Create AWS Cloudwatch Synthetics with some Uptime & Query check baselines
 *
 */
export class PocketAwsSyntheticChecks extends Construct {
  constructor(
    scope: Construct,
    private name: string,
    private config: PocketAwsSyntheticCheckProps,
  ) {
    super(scope, name);

    // synthetic response artifacts are stored here
    const syntheticArtifactsS3 = new S3Bucket(
      this,
      `${this.name}_synthetic_check_artifacts`,
      {
        bucket: `pocket-${this.config.prefix.toLowerCase()}-synthetic-checks`,
      },
    );

    new S3BucketLifecycleConfiguration(
      this,
      `${this.name}_synthetic_check_artifacts_lifecycle`,
      {
        bucket: syntheticArtifactsS3.id,
        rule: [
          {
            expiration: {
              days: 30,
            },
            id: '30-day-retention',
            status: 'Enabled',
          },
        ],
      },
    );

    // behind the scenes, Cloudwatch Synthetics are AWS-managed Lambdas
    const dataSyntheticAssume = new DataAwsIamPolicyDocument(
      this,
      `${this.name}_synthetic_check_assume`,
      {
        version: '2012-10-17',
        statement: [
          {
            effect: 'Allow',
            actions: ['sts:AssumeRole'],

            principals: [
              {
                identifiers: ['lambda.amazonaws.com'],
                type: 'Service',
              },
            ],
          },
        ],
      },
    );

    const syntheticRole = new IamRole(this, 'synthetic_check_role', {
      name: `pocket-${this.config.prefix.toLowerCase()}-synthetic-check`,

      assumeRolePolicy: dataSyntheticAssume.json,
      tags: this.config.tags,
    });

    // puts artifacts into s3, stores logs, pushes metrics to Cloudwatch
    // also create networkinterfaces if synthetic check in VPC
    const dataSyntheticAccess = new DataAwsIamPolicyDocument(
      this,
      `${this.name}_synthetic_check_access`,
      {
        version: '2012-10-17',
        statement: [
          {
            effect: 'Allow',
            actions: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            resources: ['*'],
          },
          {
            actions: ['s3:PutObject', 's3:GetObject'],
            resources: [`${syntheticArtifactsS3.arn}/*`],
          },
          {
            actions: ['s3:GetObject'],
            resources: [
              `arn:aws:s3:::pocket-syntheticchecks-${this.config.environment.toLowerCase()}/*`,
            ],
          },
          {
            actions: ['s3:GetBucketLocation'],
            resources: [syntheticArtifactsS3.arn],
          },
          {
            actions: ['s3:ListAllMyBuckets'],
            resources: ['*'],
          },
          {
            actions: ['cloudwatch:PutMetricData'],
            resources: ['*'],
            condition: [
              {
                test: 'StringEquals',
                values: ['CloudWatchSynthetics'],
                variable: 'cloudwatch:namespace',
              },
            ],
          },
          {
            actions: [
              'ec2:AttachNetworkInterface',
              'ec2:CreateNetworkInterface',
              'ec2:DeleteNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
            ],
            resources: ['*'],
          },
        ],
      },
    );

    const syntheticAccessPolicy = new IamPolicy(
      this,
      `${this.name}_synthetic_check_access_policy`,
      {
        name: `pocket-${this.config.prefix.toLowerCase()}-synthetic-check-access`,
        policy: dataSyntheticAccess.json,
      },
    );

    new IamRolePolicyAttachment(
      this,
      `${this.name}_synthetic_check_access_attach`,
      {
        role: syntheticRole.id,
        policyArn: syntheticAccessPolicy.arn,
      },
    );

    for (const uptimeConfig of this.config.uptime) {
      const count = this.config.uptime.indexOf(uptimeConfig);
      const check = new SyntheticsCanary(
        this,
        `${this.name}_synthetic_check_uptime_${count}`,
        {
          name: `${this.config.shortName.toLowerCase()}-${this.config.environment.toLowerCase()}-uptime-${count}`, // limit of 21 characters
          artifactS3Location: `s3://${syntheticArtifactsS3.bucket}/`,
          executionRoleArn: syntheticRole.arn,
          handler: 'synthetic.uptime',
          runConfig: {
            environmentVariables: {
              UPTIME_BODY: uptimeConfig.response,
              UPTIME_URL: uptimeConfig.url,
            },
            timeoutInSeconds: 180, // 3 minute timeout
          },
          runtimeVersion: 'syn-nodejs-puppeteer-6.2',
          s3Bucket: `pocket-syntheticchecks-${this.config.environment.toLowerCase()}`,
          s3Key: `aws-synthetic-${this.config.environment.toLowerCase()}.zip`,
          schedule: {
            expression: 'rate(5 minutes)', // run every 5 minutes
          },
          startCanary: true,
          vpcConfig: {
            subnetIds: this.config.subnetIds,
            securityGroupIds: this.config.securityGroupIds,
          },
        },
      );

      new CloudwatchMetricAlarm(
        this,
        `${this.name}_synthetic_check_alarm_uptime_${count}`,
        {
          alarmDescription: `Alert when ${check.name} canary success percentage has decreased below 66% in the last 15 minutes`,
          alarmName: check.name,
          comparisonOperator: 'LessThanThreshold',
          dimensions: {
            CanaryName: check.name,
          },
          evaluationPeriods: 3,
          metricName: 'SuccessPercent',
          namespace: 'CloudWatchSynthetics',
          period: 300, // 15 minutes
          statistic: 'Average',
          threshold: 66,
          treatMissingData: 'breaching',

          alarmActions:
            config.alarmTopicArn !== undefined
              ? [this.config.alarmTopicArn]
              : null,
          insufficientDataActions: [],
          okActions:
            config.alarmTopicArn !== undefined
              ? [this.config.alarmTopicArn]
              : null,
        },
      );
    }

    for (const queryConfig of this.config.query) {
      const count = this.config.query.indexOf(queryConfig);
      const check = new SyntheticsCanary(
        this,
        `${this.name}_synthetic_check_query_${count}`,
        {
          name: `${this.config.shortName.toLowerCase()}-${this.config.environment.toLowerCase()}-query-${count}`, // limit of 21 characters
          artifactS3Location: `s3://${syntheticArtifactsS3.bucket}/`,
          executionRoleArn: syntheticRole.arn,
          handler: 'synthetic.query',
          runConfig: {
            environmentVariables: {
              GRAPHQL_ENDPOINT: queryConfig.endpoint,
              GRAPHQL_USERID: queryConfig.userId,
              GRAPHQL_JMESPATH: queryConfig.jmespath,
              GRAPHQL_QUERY: queryConfig.data,
              GRAPHQL_RESPONSE: queryConfig.response,
            },
            timeoutInSeconds: 180, // 3 minute timeout
          },
          runtimeVersion: 'syn-nodejs-puppeteer-6.2',
          s3Bucket: `pocket-syntheticchecks-${this.config.environment.toLowerCase()}`,
          s3Key: `aws-synthetic-${this.config.environment.toLowerCase()}.zip`,
          schedule: {
            expression: 'rate(5 minutes)', // run every 5 minutes
          },
          startCanary: true,
          vpcConfig: {
            subnetIds: this.config.subnetIds,
            securityGroupIds: this.config.securityGroupIds,
          },
        },
      );

      new CloudwatchMetricAlarm(
        this,
        `${this.name}_synthetic_check_alarm_query_${count}`,
        {
          alarmDescription: `Alert when ${check.name} canary success percentage has decreased below 66% in the last 15 minutes`,
          alarmName: check.name,

          comparisonOperator: 'LessThanThreshold',
          dimensions: {
            CanaryName: check.name,
          },
          evaluationPeriods: 3,
          metricName: 'SuccessPercent',
          namespace: 'CloudWatchSynthetics',
          period: 300, // 15 minutes
          statistic: 'Average',
          threshold: 66,
          treatMissingData: 'breaching',

          alarmActions:
            config.alarmTopicArn !== undefined
              ? [this.config.alarmTopicArn]
              : [],
          insufficientDataActions: [],
          okActions:
            config.alarmTopicArn !== undefined
              ? [this.config.alarmTopicArn]
              : [],
        },
      );
    }
  }
}
