import { Construct } from 'constructs';
import { config } from './config';
import {
  LAMBDA_RUNTIMES,
  PocketPagerDuty,
  PocketSQSWithLambdaTarget,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import {
  dataAwsRegion,
  dataAwsCallerIdentity,
  dataAwsSsmParameter,
} from '@cdktf/provider-aws';

export class SqsLambda extends Construct {
  public readonly lambda: PocketSQSWithLambdaTarget;

  constructor(
    scope: Construct,
    private name: string,
    vpc: PocketVPC,
    region: dataAwsRegion.DataAwsRegion,
    caller: dataAwsCallerIdentity.DataAwsCallerIdentity,
    pagerDuty?: PocketPagerDuty,
  ) {
    super(scope, name);

    const { sentryDsn } = this.getEnvVariableValues();

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
        runtime: LAMBDA_RUNTIMES.NODEJS20,
        handler: 'index.handler',
        timeout: 120,
        reservedConcurrencyLimit: config.reservedConcurrencyLimit,
        environment: {
          SENTRY_DSN: sentryDsn,
          ENVIRONMENT:
            config.environment === 'Prod' ? 'production' : 'development',
          ANNOTATIONS_API_URI:
            config.environment === 'Prod'
              ? 'https://annotations-api.readitlater.com'
              : 'https://annotations-api.getpocket.dev',
        },
        ignoreEnvironmentVars: ['GIT_SHA'],
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

  private getEnvVariableValues() {
    const sentryDsn = new dataAwsSsmParameter.DataAwsSsmParameter(
      this,
      'sentry-dsn',
      {
        name: `/${config.name}/${config.environment}/SENTRY_DSN`,
      },
    );

    return { sentryDsn: sentryDsn.value };
  }
}
