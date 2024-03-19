import { Construct } from 'constructs';
import {
  s3Bucket,
  s3BucketAcl,
  s3BucketLifecycleConfiguration,
  s3BucketPublicAccessBlock,
  iamPolicy,
  dataAwsIamPolicyDocument,
  iamRolePolicyAttachment,
  iamRole,
} from '@cdktf/provider-aws';

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
  ): s3Bucket.S3Bucket {
    const s3BucketResource = new s3Bucket.S3Bucket(
      scope,
      'data-export-bucket',
      {
        bucket: config.bucket,
        tags: config.tags,
      },
    );

    new s3BucketAcl.S3BucketAcl(scope, 'data-export-bucket-acl', {
      acl: 'private',
      bucket: s3BucketResource.bucket,
    });

    new s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
      scope,
      'data-export-bucket-lifecycle',
      {
        bucket: s3BucketResource.bucket,
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
      },
    );

    new s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      scope,
      'data-export-bucket-public-block',
      {
        bucket: s3BucketResource.id,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
    );

    return s3BucketResource;
  }

  /**
   * Create the IAM policy that braze needs to put data.
   * @param scope
   * @param s3Bucket
   * @returns
   */
  private createBrazeIAMPolicy(
    scope: Construct,
    s3Bucket: s3Bucket.S3Bucket,
  ): iamPolicy.IamPolicy {
    return new iamPolicy.IamPolicy(scope, 'braze-s3-data-access-policy', {
      namePrefix: 'braze-s3-data-export',
      policy: new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        scope,
        'braze-s3-sdk',
        {
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
        },
      ).json,
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
    s3Bucket: s3Bucket.S3Bucket,
    brazeIAMPolicy: iamPolicy.IamPolicy,
    config: DataExportBucketConfig,
  ) {
    const brazeIAMRole = new iamRole.IamRole(
      scope,
      'braze-s3-data-access-role',
      {
        namePrefix: `${config.prefix}`,
        tags: config.tags,

        assumeRolePolicy: new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
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
      },
    );

    new iamRolePolicyAttachment.IamRolePolicyAttachment(
      scope,
      'braze-s3-data-access-role-policy',
      {
        policyArn: brazeIAMPolicy.arn,
        role: brazeIAMRole.name,
      },
    );
  }
}
