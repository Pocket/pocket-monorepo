import { Resource } from 'cdktf';
import { Construct } from 'constructs';
import { config } from './config';
import {
  LAMBDA_RUNTIMES,
  PocketPagerDuty,
  PocketSQSWithLambdaTarget,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

export class SqsLambda extends Resource {
  public readonly lambda: PocketSQSWithLambdaTarget;

  constructor(
    scope: Construct,
    private name: string,
    vpc: PocketVPC,
    region: DataAwsRegion,
    caller: DataAwsCallerIdentity,
    pagerDuty?: PocketPagerDuty,
  ) {
    super(scope, name);

    this.lambda = new PocketSQSWithLambdaTarget(this, 'sqs-event-consumer', {
      name: `${config.prefix}-Sqs-Event-Consumer`,
      batchSize: 10,
      batchWindow: 60,
      functionResponseTypes: ['ReportBatchItemFailures'],
      sqsQueue: {
        maxReceiveCount: 3,
        visibilityTimeoutSeconds: 300,
      },
      lambda: {
        runtime: LAMBDA_RUNTIMES.NODEJS14,
        handler: 'index.handler',
        timeout: 120,
        reservedConcurrencyLimit: config.reservedConcurrencyLimit,
        environment: {
          SENTRY_DSN: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
          GIT_SHA: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SERVICE_HASH`,
          RELEASE_SHA: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SERVICE_HASH`,
          ENVIRONMENT:
            config.environment === 'Prod' ? 'production' : 'development',
          ANNOTATIONS_API_URI:
            config.environment === 'Prod'
              ? 'https://annotations-api.readitlater.com'
              : 'https://annotations-api.getpocket.dev',
        },
        vpcConfig: {
          securityGroupIds: vpc.defaultSecurityGroups.ids,
          subnetIds: vpc.privateSubnetIds,
        },
        codeDeploy: {
          region: vpc.region,
          accountId: vpc.accountId,
        },
      },
      tags: config.tags,
    });
  }
}
