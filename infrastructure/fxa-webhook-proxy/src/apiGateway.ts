import {
  ApiGatewayLambdaRoute,
  LAMBDA_RUNTIMES,
  PocketApiGateway,
  PocketApiGatewayProps,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { config } from './config/index.ts';
import { getEnvVariableValues } from './utilities.ts';
import { Construct } from 'constructs';
import { dataAwsSnsTopic, sqsQueue } from '@cdktf/provider-aws';

export class ApiGateway extends Construct {
  constructor(
    scope: Construct,
    private name: string,
    private vpc: PocketVPC,
    private sqsQueue: sqsQueue.SqsQueue,
    alertSnsTopic: dataAwsSnsTopic.DataAwsSnsTopic,
  ) {
    super(scope, name);
    const { sentryDsn } = getEnvVariableValues(this);
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
          runtime: LAMBDA_RUNTIMES.NODEJS20,
          handler: 'index.handler',
          timeout: 120,
          environment: {
            SENTRY_DSN: sentryDsn,
            ENVIRONMENT:
              config.environment === 'Prod' ? 'production' : 'development',
            SQS_FXA_EVENTS_URL: sqsQueue.url,
          },
          ignoreEnvironmentVars: ['GIT_SHA'],
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
              actions: config.isProd
                ? [alertSnsTopic.arn]
                : [],
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
      pocketApiGatewayProps,
    );
  }
}
