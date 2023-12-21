import {
  DataArchiveFile,
  DataArchiveFileSource,
} from '@cdktf/provider-archive/lib/data-archive-file';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import {
  DataAwsIamPolicyDocumentStatement,
  DataAwsIamPolicyDocument,
} from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { LambdaAlias } from '@cdktf/provider-aws/lib/lambda-alias';
import {
  LambdaFunctionVpcConfig,
  LambdaFunction,
  LambdaFunctionConfig,
} from '@cdktf/provider-aws/lib/lambda-function';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketAcl } from '@cdktf/provider-aws/lib/s3-bucket-acl';
import { S3BucketOwnershipControls } from '@cdktf/provider-aws/lib/s3-bucket-ownership-controls';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { Fn, TerraformMetaArguments } from 'cdktf';
import { Construct } from 'constructs';

export enum LAMBDA_RUNTIMES {
  PYTHON38 = 'python3.8',
  PYTHON39 = 'python3.9',
  PYTHON310 = 'python3.10',
  PYTHON311 = 'python3.11',
  NODEJS14 = 'nodejs14.x',
  NODEJS16 = 'nodejs16.x',
  NODEJS18 = 'nodejs18.x',
  NODEJS20 = 'nodejs20.x',
}

export interface ApplicationVersionedLambdaProps
  extends TerraformMetaArguments {
  name: string;
  description?: string;
  runtime: LAMBDA_RUNTIMES;
  handler: string;
  timeout?: number;
  reservedConcurrencyLimit?: number;
  memorySizeInMb?: number;
  environment?: { [key: string]: string };
  vpcConfig?: LambdaFunctionVpcConfig;
  executionPolicyStatements?: DataAwsIamPolicyDocumentStatement[];
  tags?: { [key: string]: string };
  logRetention?: number;
  s3Bucket: string;
  usesCodeDeploy?: boolean;
}

const DEFAULT_TIMEOUT = 5;
const DEFAULT_RETENTION = 14;
//https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function#reserved_concurrent_executions
const DEFAULT_CONCURRENCY_LIMIT = -1; //unreserved concurrency
const DEFAULT_MEMORY_SIZE = 128;

export class ApplicationVersionedLambda extends Construct {
  public readonly versionedLambda: LambdaAlias;
  public readonly defaultLambda: LambdaFunction;
  public lambdaExecutionRole: IamRole;

  constructor(
    scope: Construct,
    name: string,
    private config: ApplicationVersionedLambdaProps,
  ) {
    super(scope, name);

    this.createCodeBucket();
    const { versionedLambda, lambda } = this.createLambdaFunction();
    this.versionedLambda = versionedLambda;
    this.defaultLambda = lambda;
  }

  private createLambdaFunction() {
    this.lambdaExecutionRole = new IamRole(this, 'execution-role', {
      name: `${this.config.name}-ExecutionRole`,
      assumeRolePolicy: this.getLambdaAssumePolicyDocument(),
      provider: this.config.provider,
      tags: this.config.tags,
    });

    const executionPolicy = new IamPolicy(this, 'execution-policy', {
      name: `${this.config.name}-ExecutionRolePolicy`,
      policy: this.getLambdaExecutionPolicyDocument(),
      provider: this.config.provider,
      tags: this.config.tags,
    });

    new IamRolePolicyAttachment(this, 'execution-role-policy-attachment', {
      role: this.lambdaExecutionRole.name,
      policyArn: executionPolicy.arn,
      dependsOn: [this.lambdaExecutionRole, executionPolicy],
      provider: this.config.provider,
    });

    const defaultLambda = this.getDefaultLambda();
    const lambdaConfig: LambdaFunctionConfig = {
      functionName: `${this.config.name}-Function`,
      filename: defaultLambda.outputPath,
      handler: this.config.handler,
      runtime: this.config.runtime,
      timeout: this.config.timeout ?? DEFAULT_TIMEOUT,
      sourceCodeHash: defaultLambda.outputBase64Sha256,
      role: this.lambdaExecutionRole.arn,
      memorySize: this.config.memorySizeInMb ?? DEFAULT_MEMORY_SIZE,
      reservedConcurrentExecutions:
        this.config.reservedConcurrencyLimit ?? DEFAULT_CONCURRENCY_LIMIT,
      vpcConfig: this.config.vpcConfig,
      publish: true,
      lifecycle: {
        ignoreChanges: [
          'filename',
          'source_code_hash',
          this.shouldIgnorePublish() ? 'publish' : '',
        ].filter((v: string) => v),
      },
      tags: this.config.tags,
      environment: this.config.environment
        ? { variables: this.config.environment }
        : undefined,
      provider: this.config.provider,
    };

    const lambda = new LambdaFunction(this, 'lambda', lambdaConfig);

    new CloudwatchLogGroup(this, 'log-group', {
      name: `/aws/lambda/${lambda.functionName}`,
      retentionInDays: this.config.logRetention ?? DEFAULT_RETENTION,
      dependsOn: [lambda],
      provider: this.config.provider,
      tags: this.config.tags,
    });

    const versionedLambda = new LambdaAlias(this, 'alias', {
      functionName: lambda.functionName,
      functionVersion: Fn.element(Fn.split(':', lambda.qualifiedArn), 7),
      name: 'DEPLOYED',
      lifecycle: {
        ignoreChanges: ['function_version'],
      },
      dependsOn: [lambda],
      provider: this.config.provider,
    });
    return { versionedLambda, lambda };
  }

  private shouldIgnorePublish() {
    if (this.config.usesCodeDeploy !== undefined) {
      return this.config.usesCodeDeploy;
    }

    return false;
  }

  private getLambdaAssumePolicyDocument() {
    return new DataAwsIamPolicyDocument(this, 'assume-policy-document', {
      version: '2012-10-17',
      statement: [
        {
          effect: 'Allow',
          actions: ['sts:AssumeRole'],
          principals: [
            {
              identifiers: ['lambda.amazonaws.com', 'edgelambda.amazonaws.com'],
              type: 'Service',
            },
          ],
        },
      ],
      provider: this.config.provider,
    }).json;
  }

  private getLambdaExecutionPolicyDocument() {
    const document = {
      version: '2012-10-17',
      statement: [
        {
          effect: 'Allow',
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogStreams',
          ],
          resources: ['arn:aws:logs:*:*:*'],
        },
        ...(this.config.executionPolicyStatements ?? []),
      ],
      provider: this.config.provider,
    };

    if (this.config.vpcConfig) {
      document.statement.push({
        effect: 'Allow',
        actions: [
          'ec2:DescribeNetworkInterfaces',
          'ec2:CreateNetworkInterface',
          'ec2:DeleteNetworkInterface',
          'ec2:DescribeInstances',
          'ec2:AttachNetworkInterface',
        ],
        resources: ['*'],
      });
    }

    return new DataAwsIamPolicyDocument(
      this,
      'execution-policy-document',
      document,
    ).json;
  }

  private getDefaultLambda() {
    const source = this.getDefaultLambdaSource();
    return new DataArchiveFile(this, 'lambda-default-file', {
      type: 'zip',
      source: [source],
      outputPath: `${source.filename}.zip`,
    });
  }

  private getDefaultLambdaSource(): DataArchiveFileSource {
    const runtime = this.config.runtime.match(/[a-z]*/)[0];
    const handler = this.config.handler.split('.');
    const functionName = handler.pop();
    const functionFilename = handler.join('.');

    let content = `exports.${functionName} = (event, context) => { console.log(event) }`;
    let filename = `${functionFilename}.js`;

    if (runtime === 'python') {
      content = `import json\ndef ${functionName}(event, context):\n\t print(event)\n\t return {'statusCode': 200, 'headers': {'dance': 'party'}, 'body': json.dumps({'electric': 'boogaloo'}), 'isBase64Encoded': False}`;
      filename = `${functionFilename}.py`;
    }

    return {
      content,
      filename,
    };
  }

  private createCodeBucket() {
    const codeBucket = new S3Bucket(this, 'code-bucket', {
      bucket: this.config.s3Bucket,
      tags: this.config.tags,
      forceDestroy: true,
      provider: this.config.provider,
    });

    const ownership = new S3BucketOwnershipControls(
      this,
      'code-bucket-ownership-controls',
      {
        bucket: codeBucket.id,
        rule: {
          objectOwnership: 'BucketOwnerPreferred',
        },
      },
    );

    new S3BucketAcl(this, 'code-bucket-acl', {
      bucket: codeBucket.id,
      acl: 'private',
      dependsOn: [ownership],
    });

    new S3BucketPublicAccessBlock(this, `code-bucket-public-access-block`, {
      bucket: codeBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      provider: this.config.provider,
    });
  }
}
