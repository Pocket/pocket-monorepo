import { Resource } from 'cdktf';
import { Construct } from 'constructs';
import { config } from './config';
import {
  LAMBDA_RUNTIMES,
  PocketPagerDuty,
  PocketVPC,
  PocketSQSWithLambdaTarget,
} from '@pocket-tools/terraform-modules';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

export class SQSLambda extends Resource {
  public readonly lambda: PocketSQSWithLambdaTarget;

  constructor(
    scope: Construct,
    private name: string,
    vpc: PocketVPC,
    region: DataAwsRegion,
    caller: DataAwsCallerIdentity,
    pagerDuty?: PocketPagerDuty
  ) {
    super(scope, name);

    this.lambda = new PocketSQSWithLambdaTarget(this, 'sqs-event-consumer', {
      name: `${config.prefix}-Sqs-Event-Consumer`,
      batchSize: 10, // The number of records to send to the function in each batch.
      batchWindow: 60, // The maximum amount of time to gather records before invoking the function, in seconds.
      functionResponseTypes: ['ReportBatchItemFailures'],
      sqsQueue: {
        maxReceiveCount: 3, // The number of times a message is delivered to the source queue before being moved to the dead-letter queue.
        visibilityTimeoutSeconds: 300, // A period of time during which Amazon SQS prevents all consumers from receiving and processing the message.
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
          SHAREABLE_LISTS_API_URI:
            config.environment === 'Prod'
              ? 'https://shareablelistsapi.readitlater.com'
              : 'https://shareablelistsapi.getpocket.dev',
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
