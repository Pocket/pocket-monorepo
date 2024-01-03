import {
  ApiGatewayLambdaRoute,
  LAMBDA_RUNTIMES,
  PocketApiGateway,
  PocketApiGatewayProps,
  PocketPagerDuty,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { config } from './config';
import { getEnvVariableValues } from './utilities';
import { Construct } from 'constructs';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';

export class ApiGateway extends Construct {
  constructor(
    scope: Construct,
    private name: string,
    private vpc: PocketVPC,
    private sqsQueue: SqsQueue,
    pagerDuty?: PocketPagerDuty
  ) {
    super(scope, name);
    const { sentryDsn, gitSha } = getEnvVariableValues(this);
    const fxaEventsRoute: ApiGatewayLambdaRoute = {
      path: 'events',
      method: 'POST',
      eventHandler: {
        name: `${config.prefix}-ApiGateway-FxA-Events`,
        lambda: {
          executionPolicyStatements: [
            {
              actions: ['sqs:SendMessage', 'sqs:SendMessageBatch'],
              resources: [sqsQueue.arn],
              effect: 'Allow',
            },
          ],
          runtime: LAMBDA_RUNTIMES.NODEJS14,
          handler: 'index.handler',
          timeout: 120,
          environment: {
            SENTRY_DSN: sentryDsn,
            GIT_SHA: gitSha,
            ENVIRONMENT:
              config.environment === 'Prod' ? 'production' : 'development',
            SQS_FXA_EVENTS_URL: sqsQueue.url,
          },
          vpcConfig: {
            securityGroupIds: vpc.internalSecurityGroups.ids,
            subnetIds: vpc.privateSubnetIds,
          },
          codeDeploy: {
            region: vpc.region,
            accountId: vpc.accountId,
          },
          alarms: {
            // TODO: set better alarm values
            /*
            errors: {
              evaluationPeriods: 3,
              period: 3600, // 1 hour
              threshold: 20,
              actions: config.isDev
                ? []
                : [pagerDuty!.snsNonCriticalAlarmTopic.arn],
            },
            */
          },
        },
      },
    };
    const pocketApiGatewayProps: PocketApiGatewayProps = {
      name: `${config.prefix}-API-Gateway`,
      domain: config.domain,
      stage: config.environment.toLowerCase(),
      routes: [fxaEventsRoute],
    };

    new PocketApiGateway(
      this,
      'fxa-events-apigateway-lambda',
      pocketApiGatewayProps
    );
  }
}
