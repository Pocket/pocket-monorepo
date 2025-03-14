import { config as stackConfig } from '../../config/index.ts';

import { dataAwsSsmParameter } from '@cdktf/provider-aws';
import {
  LAMBDA_RUNTIMES,
  PocketPagerDuty,
  PocketSQSWithLambdaTarget,
  PocketVersionedLambdaProps,
  PocketVPC,
} from '@pocket-tools/terraform-modules';

import { Construct } from 'constructs';

export interface SqsLambdaProps {
  vpc: PocketVPC;
  batchSize: number;
  pagerDuty?: PocketPagerDuty;
  alarms?: PocketVersionedLambdaProps['lambda']['alarms'];
  reservedConcurrencyLimit?: number;
}

export class SqsLambda extends Construct {
  public readonly lambda: PocketSQSWithLambdaTarget;

  constructor(
    scope: Construct,
    private name: string,
    config: SqsLambdaProps,
  ) {
    super(scope, name.toLowerCase());

    const { sentryDsn } = this.getEnvVariableValues();

    this.lambda = new PocketSQSWithLambdaTarget(this, name.toLowerCase(), {
      name: `${stackConfig.prefix}-${name}`,
      batchSize: config.batchSize,
      batchWindow: 60,
      functionResponseTypes: ['ReportBatchItemFailures'],
      sqsQueue: {
        maxReceiveCount: 3,
        visibilityTimeoutSeconds: 300,
      },
      lambda: {
        alarms: config.alarms,
        codeDeploy: {
          region: config.vpc.region,
          accountId: config.vpc.accountId,
        },
        environment: {
          ACCOUNT_DATA_DELETER_API_URI: `https://${stackConfig.domain}`,
          ENVIRONMENT:
            stackConfig.environment === 'Prod' ? 'production' : 'development',
          NODE_ENV:
            stackConfig.environment === 'Prod' ? 'production' : 'development',
          SENTRY_DSN: sentryDsn,
        },
        ignoreEnvironmentVars: ['GIT_SHA'],
        handler: 'index.handler',
        reservedConcurrencyLimit: config.reservedConcurrencyLimit,
        runtime: LAMBDA_RUNTIMES.NODEJS20,
        timeout: 120,
        vpcConfig: {
          securityGroupIds: config.vpc.defaultSecurityGroups.ids,
          subnetIds: config.vpc.privateSubnetIds,
        },
      },
      tags: stackConfig.tags,
    });
  }

  private getEnvVariableValues() {
    const sentryDsn = new dataAwsSsmParameter.DataAwsSsmParameter(
      this,
      'sentry-dsn',
      {
        name: `/${stackConfig.name}/${stackConfig.environment}/SENTRY_DSN`,
      },
    );

    return { sentryDsn: sentryDsn.value };
  }
}
