import {
  dataAwsIamPolicyDocument,
  s3Bucket,
  s3BucketPolicy,
  securityGroup,
  alb,
  dataAwsElbServiceAccount,
  dataAwsS3Bucket,
  dataAwsEc2ManagedPrefixList,
} from '@cdktf/provider-aws';
import { TerraformMetaArguments, TerraformProvider } from 'cdktf';
import { Construct } from 'constructs';

export interface ApplicationLoadBalancerProps extends TerraformMetaArguments {
  prefix: string;
  alb6CharacterPrefix: string;
  vpcId: string;
  subnetIds: string[];
  internal?: boolean;
  useCloudfrontManagedPrefixList?: boolean;
  /**
   * Optional config to dump alb access logs to a bucket.
   */
  accessLogs?: {
    /**
     * Existing bucket to dump alb logs to, one of existingBucket or bucket must be chosen.
     */
    existingBucket?: string;

    /**
     * Bucket to dump alb logs too, one of existingBucket or bucket must be chosen.
     */
    bucket?: string;

    /**
     * Optional bucket path prefix. If not defined will use server-logs/{service-name}/alb/AWSLogs/{awsaccountid}/elasticloadbalancing/
     * Be sure to include a trailing /
     */
    prefix?: string;
  };
  /**
   * Optional config to dump alb connection logs to a bucket.
   */
  connectionLogs?: {
    /**
     * Existing bucket to dump alb logs to, one of existingBucket or bucket must be chosen.
     */
    existingBucket?: string;

    /**
     * Bucket to dump alb logs too, one of existingBucket or bucket must be chosen.
     */
    bucket?: string;

    /**
     * Optional bucket path prefix. If not defined will use server-logs/{service-name}/albConnection/AWSLogs/{awsaccountid}/elasticloadbalancing/
     * Be sure to include a trailing /
     */
    prefix?: string;
  };
  tags?: { [key: string]: string };
}

/**
 * Generates an Application Certificate given a domain name and zoneId
 */
export class ApplicationLoadBalancer extends Construct {
  public readonly alb: alb.Alb;
  public readonly securityGroup: securityGroup.SecurityGroup;

  constructor(
    scope: Construct,
    name: string,
    config: ApplicationLoadBalancerProps,
  ) {
    super(scope, name);

    let ingress: securityGroup.SecurityGroupIngress = {
      fromPort: 443,
      toPort: 443,
      protocol: 'TCP',
      cidrBlocks: ['0.0.0.0/0'],
    };

    if (config.useCloudfrontManagedPrefixList) {
      const prefixList =
        new dataAwsEc2ManagedPrefixList.DataAwsEc2ManagedPrefixList(
          this,
          'alb_cloudfront_security',
          { name: 'com.amazonaws.global.cloudfront.origin-facing' },
        );
      ingress = {
        fromPort: 443,
        toPort: 443,
        protocol: 'TCP',
        prefixListIds: [prefixList.id],
      };
    }

    this.securityGroup = new securityGroup.SecurityGroup(
      this,
      `alb_security_group`,
      {
        namePrefix: `${config.prefix}-HTTP/S Security Group`,
        description: 'External security group  (Managed by Terraform)',
        vpcId: config.vpcId,
        ingress: [
          ingress,
          {
            // Allow anything on Port 80 because its always a redirect to 443 which could have blocks for Cloudfront only
            fromPort: 80,
            toPort: 80,
            protocol: 'TCP',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            fromPort: 0,
            protocol: '-1',
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'required',
            ipv6CidrBlocks: [],
            prefixListIds: [],
            securityGroups: [],
          },
        ],
        tags: {
          ...config.tags,
          Name: `${config.prefix}-HTTP/S Security Group`,
        },
        lifecycle: {
          createBeforeDestroy: true,
        },
        provider: config.provider,
      },
    );

    let accessLogsConfig: alb.AlbAccessLogs | undefined = undefined;

    if (config.accessLogs !== undefined) {
      const defaultPrefix = `server-logs/${config.prefix.toLowerCase()}/alb`;

      const prefix =
        config.accessLogs.prefix === undefined
          ? defaultPrefix
          : config.accessLogs.prefix;

      if (
        prefix.charAt(prefix.length - 1) === '/' ||
        prefix.charAt(0) === '/'
      ) {
        throw new Error("Access logs prefix cannot start or end with '/'");
      }

      const bucket = this.getOrCreateBucket({
        logType: 'access',
        bucket: config.accessLogs.bucket,
        existingBucket: config.accessLogs.existingBucket,
        provider: config.provider,
        tags: config.tags,
      });

      accessLogsConfig = {
        bucket,
        enabled: true,
        prefix,
      };
    }

    let connectionLogsConfig: alb.AlbConnectionLogs | undefined = undefined;

    if (config.connectionLogs !== undefined) {
      const defaultPrefix = `server-logs/${config.prefix.toLowerCase()}/alb-connection`;

      const prefix =
        config.connectionLogs.prefix === undefined
          ? defaultPrefix
          : config.connectionLogs.prefix;

      if (
        prefix.charAt(prefix.length - 1) === '/' ||
        prefix.charAt(0) === '/'
      ) {
        throw new Error("Connection logs prefix cannot start or end with '/'");
      }

      const bucket = this.getOrCreateBucket({
        logType: 'connection',
        bucket: config.connectionLogs.bucket,
        existingBucket: config.connectionLogs.existingBucket,
        provider: config.provider,
        tags: config.tags,
      });

      connectionLogsConfig = {
        bucket,
        enabled: true,
        prefix,
      };
    }

    const albConfig: alb.AlbConfig = {
      namePrefix: config.alb6CharacterPrefix,
      securityGroups: [this.securityGroup.id],
      internal: config.internal !== undefined ? config.internal : false,
      subnets: config.subnetIds,
      tags: config.tags,
      accessLogs: accessLogsConfig,
      connectionLogs: connectionLogsConfig,
      provider: config.provider,
    };

    this.alb = new alb.Alb(this, `alb`, albConfig);
  }

  /**
   *
   * @param config Creates a bucket according to https://docs.aws.amazon.com/elasticloadbalancing/latest/application/enable-access-logging.html#attach-bucket-policy if one does not exist
   * @returns
   */
  private getOrCreateBucket(config: {
    logType: 'access' | 'connection';
    existingBucket?: string;
    bucket?: string;
    tags?: { [key: string]: string };
    provider?: TerraformProvider;
  }): string {
    if (config.existingBucket === undefined && config.bucket === undefined) {
      throw new Error(
        'If you are configuring access or connection logs you need to define either an existing bucket or a new one to store the logs',
      );
    }

    if (config.existingBucket !== undefined) {
      return new dataAwsS3Bucket.DataAwsS3Bucket(
        this,
        `${config.logType}-log-bucket`,
        {
          bucket: config.existingBucket,
          provider: config.provider,
        },
      ).bucket;
    }

    const s3BucketResource = new s3Bucket.S3Bucket(
      this,
      `${config.logType}-log-bucket`,
      {
        bucket: config.bucket,
        provider: config.provider,
        tags: config.tags,
      },
    );

    // this could be factored out of this function, but i'm not sure it's
    // worth the complexity
    const albAccountId = new dataAwsElbServiceAccount.DataAwsElbServiceAccount(
      this,
      `${config.logType}-elb-service-account`,
      { provider: config.provider },
    ).id;

    const s3IAMDocument = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
      this,
      `${config.logType}-iam-log-bucket-policy-document`,
      {
        statement: [
          {
            effect: 'Allow',
            principals: [
              {
                type: 'AWS',
                identifiers: [`arn:aws:iam::${albAccountId}:root`],
              },
            ],
            actions: ['s3:PutObject'],
            resources: [`arn:aws:s3:::${s3BucketResource.bucket}/*`],
          },
        ],
        provider: config.provider,
      },
    );

    new s3BucketPolicy.S3BucketPolicy(
      this,
      `${config.logType}-log-bucket-policy`,
      {
        bucket: s3BucketResource.bucket,
        policy: s3IAMDocument.json,
        provider: config.provider,
      },
    );

    return s3BucketResource.bucket;
  }
}
