import { config as stackConfig } from './config';

import { dataAwsSsmParameter } from '@cdktf/provider-aws';
import {
  PocketSQSWithLambdaTarget,
  LAMBDA_RUNTIMES,
  PocketPagerDuty,
  PocketVersionedLambdaProps,
  PocketVPC,
} from '@pocket-tools/terraform-modules';

import { Construct } from 'constructs';

export interface SqsLambdaProps {
  vpc: PocketVPC;
  pagerDuty?: PocketPagerDuty;
  alarms?: PocketVersionedLambdaProps['lambda']['alarms'];
}

export class SQSEventLambda extends Construct {
  public readonly construct: PocketSQSWithLambdaTarget;

  constructor(scope: Construct, name: string, config: SqsLambdaProps) {
    super(scope, name.toLowerCase());

    const { sentryDsn } = this.getEnvVariableValues();

    this.construct = new PocketSQSWithLambdaTarget(this, name.toLowerCase(), {
      name: `${stackConfig.prefix}-${name}`,
      batchSize: 100,
      batchWindow: 30,
      sqsQueue: {
        maxReceiveCount: 3,
        visibilityTimeoutSeconds: 300,
      },
      functionResponseTypes: ['ReportBatchItemFailures'],
      lambda: {
        runtime: LAMBDA_RUNTIMES.NODEJS20,
        handler: 'index.handler',
        timeout: 300,
        reservedConcurrencyLimit: 10,
        environment: {
          SENTRY_DSN: sentryDsn,
          ENVIRONMENT:
            stackConfig.environment === 'Prod' ? 'production' : 'development',
        },
        ignoreEnvironmentVars: ['GIT_SHA'],
        vpcConfig: {
          securityGroupIds: config.vpc.defaultSecurityGroups.ids,
          subnetIds: config.vpc.privateSubnetIds,
        },
        codeDeploy: {
          region: config.vpc.region,
          accountId: config.vpc.accountId,
        },
        alarms: config.alarms,
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
