import { config, config as stackConfig } from '../config/index.ts';

import {
  dataAwsSsmParameter,
  lambdaPermission,
} from '@cdktf/provider-aws';
import {
  ApplicationEventBridgeRule,
  LAMBDA_RUNTIMES,
  PocketVersionedLambda,
  PocketVPC,
} from '@pocket-tools/terraform-modules';

import { Construct } from 'constructs';

export class BatchDeleteLambdaResources extends Construct {
  public readonly batchDeleteLambda: PocketVersionedLambda;
  constructor(
    scope: Construct,
    private name: string,
    private vpc: PocketVPC,
  ) {
    super(scope, name.toLowerCase());

    const { sentryDsn } = this.getEnvVariableValues();

    // lambda fetches the userId from the dynamoDb in batches and calls deleteMutation
    // The IDs are then moved to a separate table for record-keeping
    this.batchDeleteLambda = new PocketVersionedLambda(
      this,
      'batch-delete-lambda',
      {
        name: `${stackConfig.prefix}-${stackConfig.lambda.batchDeleteLambda.name}`,
        lambda: {
          description:
            'batch delete lambda that gets id from dynamoDb and calls deleteMutation',
          runtime: LAMBDA_RUNTIMES.NODEJS20,
          handler: 'index.handler',
          reservedConcurrencyLimit:
            stackConfig.lambda.batchDeleteLambda.reservedConcurrencyLimit,
          timeout: 120,
          environment: {
            SENTRY_DSN: sentryDsn,
            ENVIRONMENT:
              stackConfig.environment === 'Prod' ? 'production' : 'development',
            NODE_ENV:
              stackConfig.environment === 'Prod' ? 'production' : 'development',
            USER_API: `https://${stackConfig.userApiDomain}`,
          },
          ignoreEnvironmentVars: ['GIT_SHA'],
          vpcConfig: {
            securityGroupIds: this.vpc.defaultSecurityGroups.ids,
            subnetIds: this.vpc.privateSubnetIds,
          },
          codeDeploy: {
            region: this.vpc.region,
            accountId: this.vpc.accountId,
          },
          alarms: {},
        },
        tags: stackConfig.tags,
      },
    );

    if (!config.isDev) {
      this.addScheduledEventToInvokeLambda();
    }
  }

  /**
   * function to create scheduled event that triggers the batchDelete lambda
   * schedule frequency is set in `triggerInMinutes` in config file
   * Sets permission for event to invoke lambda.
   * @private
   * @returns cloudwatch event
   */
  private addScheduledEventToInvokeLambda() {
    //cloudwatch event that triggers the batchDeleteLambda
    //when this event is processed, lambda scheduled next `maxBatchSize`userIds for deletion
    const scheduledEvent = new ApplicationEventBridgeRule(
      this,
      'add-batchDelete-lambda-trigger',
      {
        description: 'event to trigger AccountDeletion- batchDeleteLambda',
        name: `${config.prefix}-BatchDelete-Lambda-Trigger`,
        //todo: set proper limit after testing
        scheduleExpression: `rate(${config.lambda.batchDeleteLambda.trigger})`,
        targets: [
          {
            arn: this.batchDeleteLambda.lambda.defaultLambda.arn,
            targetId: `${config.prefix}-BatchDeleteLambda-Rule-Target`,
          },
        ],
      },
    );

    //permission for scheduledEvent to invoke the batchDeleteLambda
    new lambdaPermission.LambdaPermission(
      this,
      `${config.prefix}-batchLambda-permission`,
      {
        principal: 'events.amazonaws.com',
        action: 'lambda:InvokeFunction',
        functionName: this.batchDeleteLambda.lambda.defaultLambda.arn,
        sourceArn: scheduledEvent.rule.arn,
      },
    );
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
