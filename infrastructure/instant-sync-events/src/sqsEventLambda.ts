import { config as stackConfig } from './config';

import {
  dataAwsSsmParameter,
  dataAwsRegion,
  dataAwsCallerIdentity,
  dataAwsKmsAlias,
  dataAwsSqsQueue,
} from '@cdktf/provider-aws';
import {
  PocketSQSWithLambdaTarget,
  LAMBDA_RUNTIMES,
  PocketVersionedLambdaProps,
  PocketVPC,
} from '@pocket-tools/terraform-modules';

import { Construct } from 'constructs';

export interface SqsLambdaProps {
  vpc: PocketVPC;
  alarms?: PocketVersionedLambdaProps['lambda']['alarms'];
  pushQueue: dataAwsSqsQueue.DataAwsSqsQueue;
}

export class SQSEventLambda extends Construct {
  public readonly construct: PocketSQSWithLambdaTarget;

  constructor(scope: Construct, name: string, config: SqsLambdaProps) {
    super(scope, name.toLowerCase());

    const { sentryDsn } = this.getEnvVariableValues();

    const region = new dataAwsRegion.DataAwsRegion(this, 'region');
    const caller = new dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'caller',
    );

    const secretsManagerKmsAlias = new dataAwsKmsAlias.DataAwsKmsAlias(
      this,
      'kms_alias',
      {
        name: 'alias/aws/secretsmanager',
      },
    );

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
        memorySizeInMb: 1024, // AWS Secret Store Layer requires at least 1024MB to work, no idea why, but AWS support had us increase it to this value, and it worked way better and stopped erroring.
        timeout: 900,
        reservedConcurrencyLimit: 10,
        environment: {
          SENTRY_DSN: sentryDsn,
          ENVIRONMENT:
            stackConfig.environment === 'Prod' ? 'production' : 'development',
          PUSH_QUEUE_URL: config.pushQueue.url,
          DB_SECRET_NAME: stackConfig.databaseSecretName,
          PARAMETERS_SECRETS_EXTENSION_MAX_CONNECTIONS: '50',
          SECRETS_MANAGER_TIMEOUT_MILLIS: '5000',
        },
        addParameterStoreAndSecretsLayer: true,
        ignoreEnvironmentVars: ['GIT_SHA'],
        vpcConfig: {
          securityGroupIds: config.vpc.defaultSecurityGroups.ids,
          subnetIds: config.vpc.privateSubnetIds,
        },
        executionPolicyStatements: [
          {
            actions: ['secretsmanager:GetSecretValue', 'kms:Decrypt'],
            resources: [
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/*`,
              secretsManagerKmsAlias.targetKeyArn,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${stackConfig.name}/${stackConfig.environment}`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${stackConfig.name}/${stackConfig.environment}/*`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${stackConfig.prefix}`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${stackConfig.prefix}/*`,
            ],
            effect: 'Allow',
          },
          //This policy could probably go in the shared module in the future.
          {
            actions: ['ssm:GetParameter*'],
            resources: [
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${stackConfig.name}/${stackConfig.environment}`,
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${stackConfig.name}/${stackConfig.environment}/*`,
            ],
            effect: 'Allow',
          },
          {
            actions: ['sqs:SendMessage', 'sqs:SendMessageBatch'],
            resources: [config.pushQueue.arn],
          },
        ],
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
