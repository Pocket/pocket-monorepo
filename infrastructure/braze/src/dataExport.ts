import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketAcl } from '@cdktf/provider-aws/lib/s3-bucket-acl';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';

export interface DataExportBucketConfig {
  brazeExternalId: string;
  brazeAccountId: string;
  bucket: string;
  tags: { [key: string]: string };
  prefix: string;
}

export class DataExportBucket extends Construct {
  constructor(scope: Construct, name: string, config: DataExportBucketConfig) {
    super(scope, name);
    const s3Bucket = this.createS3Bucket(this, config);
    const brazeIAMPolicy = this.createBrazeIAMPolicy(this, s3Bucket);
    this.createBrazeIAMRole(this, s3Bucket, brazeIAMPolicy, config);
  }

  /**
   * Create the S3 bucket for Braze to dump data to
   * @param scope
   * @param config
   * @returns
   */
  private createS3Bucket(
    scope: Construct,
    config: DataExportBucketConfig,
  ): S3Bucket {
    const s3Bucket = new S3Bucket(scope, 'data-export-bucket', {
      bucket: config.bucket,
      tags: config.tags,
    });

    new S3BucketAcl(scope, 'data-export-bucket-acl', {
      acl: 'private',
      bucket: s3Bucket.bucket,
    });

    new S3BucketLifecycleConfiguration(scope, 'data-export-bucket-lifecycle', {
      bucket: s3Bucket.bucket,
      rule: [
        {
          id: 'expiration-rule',
          status: 'Enabled',
          //expire any data after 90 days
          expiration: {
            days: 90,
          },
        },
      ],
    });

    new S3BucketPublicAccessBlock(scope, 'data-export-bucket-public-block', {
      bucket: s3Bucket.id,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    return s3Bucket;
  }

  /**
   * Create the IAM policy that braze needs to put data.
   * @param scope
   * @param s3Bucket
   * @returns
   */
  private createBrazeIAMPolicy(
    scope: Construct,
    s3Bucket: S3Bucket,
  ): IamPolicy {
    return new IamPolicy(scope, 'braze-s3-data-access-policy', {
      namePrefix: 'braze-s3-data-export',
      policy: new DataAwsIamPolicyDocument(scope, 'braze-s3-sdk', {
        statement: [
          {
            actions: ['s3:ListBucket', 's3:GetBucketLocation'],
            resources: [`arn:aws:s3:::${s3Bucket.bucket}`],
            effect: 'Allow',
          },
          {
            actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            resources: [`arn:aws:s3:::${s3Bucket.bucket}/*`],
            effect: 'Allow',
          },
        ],
      }).json,
    });
  }

  /**
   * Create the Braze IAM Role that Braze will assume cross account
   * @param scope
   * @param s3Bucket
   * @param brazeIAMPolicy
   * @param config
   */
  private createBrazeIAMRole(
    scope: Construct,
    s3Bucket: S3Bucket,
    brazeIAMPolicy: IamPolicy,
    config: DataExportBucketConfig,
  ) {
    const brazeIAMRole = new IamRole(scope, 'braze-s3-data-access-role', {
      namePrefix: `${config.prefix}`,
      tags: config.tags,

      assumeRolePolicy: new DataAwsIamPolicyDocument(
        this,
        'braze-s3-data-export-assume-role-policy',
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                {
                  type: 'AWS',
                  identifiers: [config.brazeAccountId],
                },
              ],
              condition: [
                {
                  variable: 'sts:ExternalId',
                  test: 'StringEquals',
                  values: [config.brazeExternalId],
                },
              ],
            },
          ],
        },
      ).json,
    });

    new IamRolePolicyAttachment(scope, 'braze-s3-data-access-role-policy', {
      policyArn: brazeIAMPolicy.arn,
      role: brazeIAMRole.name,
    });
  }
}
