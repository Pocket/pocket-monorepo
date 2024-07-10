import {
  ApiGatewayLambdaRoute,
  LAMBDA_RUNTIMES,
  PocketApiGateway,
  PocketApiGatewayProps,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { config } from './config';
import { getEnvVariableValues } from './utilities';
import { Construct } from 'constructs';

export class ApiGateway extends Construct {
  constructor(
    scope: Construct,
    private name: string,
    private vpc: PocketVPC,
  ) {
    super(scope, name);
    const { sentryDsn } = getEnvVariableValues(this);

    const sendGridDataRoute: ApiGatewayLambdaRoute = {
      path: 'events',
      method: 'POST',
      eventHandler: {
        name: `${config.prefix}-ApiGateway`,
        lambda: {
          executionPolicyStatements: [
            {
              actions: ['firehose:PutRecordBatch', 'firehose:PutRecord'],
              resources: [
                `arn:aws:firehose:*:*:deliverystream/${config.firehoseStream}`,
              ],
              effect: 'Allow',
            },
            {
              actions: ['cloudwatch:PutMetricData'],
              resources: [`*`],
              effect: 'Allow',
            },
            {
              actions: [
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
                'logs:CreateLogStream',
                'logs:CreateLogGroup',
              ],
              resources: [`arn:aws:logs:*:*:*`],
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
            AWS_CLOUDWATCH_METRIC_NAMESPACE: config.prefix,
            AWS_FIREHOSE_DELIVERY_STREAM_NAME: config.firehoseStream,
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
      routes: [sendGridDataRoute],
    };

    new PocketApiGateway(
      this,
      'sendgrid-data-apigateway-lambda',
      pocketApiGatewayProps,
    );
  }
}
