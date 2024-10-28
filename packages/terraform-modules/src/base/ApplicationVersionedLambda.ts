import {
  DataArchiveFile,
  DataArchiveFileSource,
} from '@cdktf/provider-archive/lib/data-archive-file';
import {
  cloudwatchLogGroup,
  dataAwsIamPolicyDocument,
  iamPolicy,
  iamRole,
  iamRolePolicyAttachment,
  lambdaFunction,
  s3Bucket,
  s3BucketAcl,
  s3BucketPublicAccessBlock,
  s3BucketOwnershipControls,
  lambdaAlias,
} from '@cdktf/provider-aws';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';

import { Fn, TerraformMetaArguments, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

export enum LAMBDA_RUNTIMES {
  PYTHON38 = 'python3.8',
  PYTHON39 = 'python3.9',
  PYTHON310 = 'python3.10',
  PYTHON311 = 'python3.11',
  PYTHON312 = 'python3.12',
  NODEJS14 = 'nodejs14.x',
  NODEJS16 = 'nodejs16.x',
  NODEJS18 = 'nodejs18.x',
  NODEJS20 = 'nodejs20.x',
}

/**
 * Map of Lambda X86_X64 Layers from https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html#ps-integration-lambda-extensions-add
 *
 * We only map the X86_X64 layers because right now this module only supports X64 lambdas
 */
export const LAMBDA_SECRETS_X86_X64_LAYER_ARN_MAP: Record<string, string> = {
  'us-east-2':
    'arn:aws:lambda:us-east-2:590474943231:layer:AWS-Parameters-and-Secrets-Lambda-Extension:14',
  'us-east-1':
    'arn:aws:lambda:us-east-1:177933569100:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'us-west-1':
    'arn:aws:lambda:us-west-1:997803712105:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'us-west-2':
    'arn:aws:lambda:us-west-2:345057560386:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'af-south-1':
    'arn:aws:lambda:af-south-1:317013901791:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'ap-east-1':
    'arn:aws:lambda:ap-east-1:768336418462:layer:AWS-Parameters-and-Secrets-Lambda-Extension:14',
  'ap-south-2':
    'arn:aws:lambda:ap-south-2:070087711984:layer:AWS-Parameters-and-Secrets-Lambda-Extension:9',
  'ap-southeast-3':
    'arn:aws:lambda:ap-southeast-3:490737872127:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'ap-southeast-4':
    'arn:aws:lambda:ap-southeast-4:090732460067:layer:AWS-Parameters-and-Secrets-Lambda-Extension:2',
  'ap-southeast-5':
    'arn:aws:lambda:ap-southeast-5:090732460067:layer:AWS-Parameters-and-Secrets-Lambda-Extension:1',
  'ap-south-1':
    'arn:aws:lambda:ap-south-1:176022468876:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'ap-northeast-3':
    'arn:aws:lambda:ap-northeast-3:576959938190:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'ap-northeast-2':
    'arn:aws:lambda:ap-northeast-2:738900069198:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'ap-southeast-1':
    'arn:aws:lambda:ap-southeast-1:044395824272:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'ap-southeast-2':
    'arn:aws:lambda:ap-southeast-2:665172237481:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'ap-northeast-1':
    'arn:aws:lambda:ap-northeast-1:133490724326:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'ca-central-1':
    'arn:aws:lambda:ca-central-1:200266452380:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'ca-west-1':
    'arn:aws:lambda:ca-west-1:243964427225:layer:AWS-Parameters-and-Secrets-Lambda-Extension:2',
  'cn-north-1':
    'arn:aws-cn:lambda:cn-north-1:287114880934:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'cn-northwest-1':
    'arn:aws-cn:lambda:cn-northwest-1:287310001119:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'eu-central-1':
    'arn:aws:lambda:eu-central-1:187925254637:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'eu-west-1':
    'arn:aws:lambda:eu-west-1:015030872274:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'eu-west-2':
    'arn:aws:lambda:eu-west-2:133256977650:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'eu-south-1':
    'arn:aws:lambda:eu-south-1:325218067255:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'eu-west-3':
    'arn:aws:lambda:eu-west-3:780235371811:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'eu-south-2':
    'arn:aws:lambda:eu-south-2:524103009944:layer:AWS-Parameters-and-Secrets-Lambda-Extension:9',
  'eu-north-1':
    'arn:aws:lambda:eu-north-1:427196147048:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'il-central-1':
    'arn:aws:lambda:il-central-1:148806536434:layer:AWS-Parameters-and-Secrets-Lambda-Extension:2',
  'eu-central-2':
    'arn:aws:lambda:eu-central-2:772501565639:layer:AWS-Parameters-and-Secrets-Lambda-Extension:9',
  'me-south-1':
    'arn:aws:lambda:me-south-1:832021897121:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'me-central-1':
    'arn:aws:lambda:me-central-1:858974508948:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'sa-east-1':
    'arn:aws:lambda:sa-east-1:933737806257:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'us-gov-east-1':
    'arn:aws-us-gov:lambda:us-gov-east-1:129776340158:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
  'us-gov-west-1':
    'arn:aws-us-gov:lambda:us-gov-west-1:127562683043:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12',
};

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
  vpcConfig?: lambdaFunction.LambdaFunctionVpcConfig;
  executionPolicyStatements?: dataAwsIamPolicyDocument.DataAwsIamPolicyDocumentStatement[];
  tags?: { [key: string]: string };
  logRetention?: number;
  s3Bucket: string;
  usesCodeDeploy?: boolean;
  ignoreEnvironmentVars?: string[];
  addParameterStoreAndSecretsLayer?: boolean;
  layers?: string[];
}

const DEFAULT_TIMEOUT = 5;
const DEFAULT_RETENTION = 14;
//https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function#reserved_concurrent_executions
const DEFAULT_CONCURRENCY_LIMIT = -1; //unreserved concurrency
const DEFAULT_MEMORY_SIZE = 128;

export class ApplicationVersionedLambda extends Construct {
  public readonly versionedLambda: lambdaAlias.LambdaAlias;
  public readonly defaultLambda: lambdaFunction.LambdaFunction;
  public lambdaExecutionRole: iamRole.IamRole;

  constructor(
    scope: Construct,
    name: string,
    private config: ApplicationVersionedLambdaProps,
  ) {
    super(scope, name);

    if (!config.ignoreEnvironmentVars) {
      config.ignoreEnvironmentVars = [];
    }

    this.createCodeBucket();
    const { versionedLambda, lambda } = this.createLambdaFunction();
    this.versionedLambda = versionedLambda;
    this.defaultLambda = lambda;
  }

  private createLambdaFunction() {
    this.lambdaExecutionRole = new iamRole.IamRole(this, 'execution-role', {
      name: `${this.config.name}-ExecutionRole`,
      assumeRolePolicy: this.getLambdaAssumePolicyDocument(),
      provider: this.config.provider,
      tags: this.config.tags,
    });

    const executionPolicy = new iamPolicy.IamPolicy(this, 'execution-policy', {
      name: `${this.config.name}-ExecutionRolePolicy`,
      policy: this.getLambdaExecutionPolicyDocument(),
      provider: this.config.provider,
      tags: this.config.tags,
    });

    new iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'execution-role-policy-attachment',
      {
        role: this.lambdaExecutionRole.name,
        policyArn: executionPolicy.arn,
        dependsOn: [this.lambdaExecutionRole, executionPolicy],
        provider: this.config.provider,
      },
    );

    const layers = this.config.layers ?? [];
    if (this.config.addParameterStoreAndSecretsLayer) {
      const region = new DataAwsRegion(this, 'lambda-region');
      // use a fn to look up the values, because region is terraform runtime not build time.
      const layer = Fn.lookup(
        LAMBDA_SECRETS_X86_X64_LAYER_ARN_MAP,
        region.name,
      );
      layers.push(layer);
    }

    const defaultLambda = this.getDefaultLambda();
    const lambdaConfig: lambdaFunction.LambdaFunctionConfig = {
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
          ...this.config.ignoreEnvironmentVars.map(
            (value) => `environment["${value}"]`,
          ),
        ].filter((v: string) => v),
      },
      tags: this.config.tags,
      environment: this.config.environment
        ? { variables: this.config.environment }
        : undefined,
      layers: layers.length === 0 ? undefined : layers,
      provider: this.config.provider,
    };

    const lambda = new lambdaFunction.LambdaFunction(
      this,
      'lambda',
      lambdaConfig,
    );

    new TerraformOutput(this, 'lambda_function_name', {
      value: lambda.functionName,
      description: 'Lambda Function Name',
    });

    new TerraformOutput(this, 'lambda_arn', {
      value: lambda.arn,
      description: 'Lambda Function ARN',
    });

    new cloudwatchLogGroup.CloudwatchLogGroup(this, 'log-group', {
      name: `/aws/lambda/${lambda.functionName}`,
      retentionInDays: this.config.logRetention ?? DEFAULT_RETENTION,
      dependsOn: [lambda],
      provider: this.config.provider,
      tags: this.config.tags,
    });

    const versionedLambda = new lambdaAlias.LambdaAlias(this, 'alias', {
      functionName: lambda.functionName,
      functionVersion: Fn.element(Fn.split(':', lambda.qualifiedArn), 7),
      name: 'DEPLOYED',
      lifecycle: {
        ignoreChanges: ['function_version'],
      },
      dependsOn: [lambda],
      provider: this.config.provider,
    });

    new TerraformOutput(this, 'lambda_version_arn', {
      value: versionedLambda.arn,
      description: 'Lambda Version ARN',
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
    return new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
      this,
      'assume-policy-document',
      {
        version: '2012-10-17',
        statement: [
          {
            effect: 'Allow',
            actions: ['sts:AssumeRole'],
            principals: [
              {
                identifiers: [
                  'lambda.amazonaws.com',
                  'edgelambda.amazonaws.com',
                ],
                type: 'Service',
              },
            ],
          },
        ],
        provider: this.config.provider,
      },
    ).json;
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

    return new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
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
    const codeBucket = new s3Bucket.S3Bucket(this, 'code-bucket', {
      bucket: this.config.s3Bucket,
      tags: this.config.tags,
      forceDestroy: true,
      provider: this.config.provider,
    });

    const ownership = new s3BucketOwnershipControls.S3BucketOwnershipControls(
      this,
      'code-bucket-ownership-controls',
      {
        bucket: codeBucket.id,
        rule: {
          objectOwnership: 'BucketOwnerPreferred',
        },
      },
    );

    new s3BucketAcl.S3BucketAcl(this, 'code-bucket-acl', {
      bucket: codeBucket.id,
      acl: 'private',
      dependsOn: [ownership],
    });

    new s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      `code-bucket-public-access-block`,
      {
        bucket: codeBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        provider: this.config.provider,
      },
    );
  }
}
