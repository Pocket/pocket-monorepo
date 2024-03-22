import { Construct } from 'constructs';
import { config } from './config';
import { dataAwsSsmParameter } from '@cdktf/provider-aws';
import {
  PocketVPC,
  PocketSQSWithLambdaTarget,
  PocketPagerDuty,
  LAMBDA_RUNTIMES,
} from '@pocket-tools/terraform-modules';

export class TransactionalEmailSQSLambda extends Construct {
  public readonly construct: PocketSQSWithLambdaTarget;
  constructor(
    scope: Construct,
    private name: string,
    vpc: PocketVPC,
    pagerDuty?: PocketPagerDuty,
  ) {
    super(scope, name);

    const { sentryDsn } = this.getEnvVariableValues();

    this.construct = new PocketSQSWithLambdaTarget(this, 'sqs-event-consumer', {
      name: `${config.prefix}-Sqs-Event-Consumer`,
      batchSize: 10,
      batchWindow: 60,
      sqsQueue: {
        maxReceiveCount: 3,
        visibilityTimeoutSeconds: 300,
      },
      functionResponseTypes: ['ReportBatchItemFailures'],
      lambda: {
        runtime: LAMBDA_RUNTIMES.NODEJS20,
        handler: 'index.handler',
        timeout: 120,
        environment: {
          SENTRY_DSN: sentryDsn,
          NODE_ENV:
            config.environment === 'Prod' ? 'production' : 'development',
          SSM_BRAZE_API_KEY_NAME: `/${config.name}/${config.environment}/BRAZE_API_KEY`,
          BRAZE_ENDPOINT: 'https://rest.iad-05.braze.com',
          BRAZE_ACCOUNT_DELETION_CAMPAIGN_ID:
            config.lambda.braze.accountDeletionCampaignId,
          BRAZE_MARKETING_SUBSCRIPTION_ID:
            config.lambda.braze.marketingEmailSubscription,
          BRAZE_FORGOT_PASSWORD_CAMPAIGN_ID:
            config.lambda.braze.forgotPasswordCampaignId,
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
        executionPolicyStatements: [
          {
            effect: 'Allow',
            actions: ['ssm:GetParameter*'],
            resources: [
              `arn:aws:ssm:${vpc.region}:${vpc.accountId}:parameter/${config.name}/${config.environment}`,
              `arn:aws:ssm:${vpc.region}:${vpc.accountId}:parameter/${config.name}/${config.environment}/*`,
            ],
          },
        ],
        alarms: {
          //alert if we have 150 errors in 4 eval period of 15 mins (1 hr)
          errors: {
            evaluationPeriods: 4,
            period: 900, //15 minutes
            threshold: 150,
            actions: config.isDev
              ? []
              : [pagerDuty!.snsNonCriticalAlarmTopic.arn],
          },
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
