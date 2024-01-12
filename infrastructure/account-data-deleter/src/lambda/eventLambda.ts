import { SqsLambda, SqsLambdaProps } from './base/sqsLambda';
import { config as stackConfig } from '../config';

import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { ApplicationSqsSnsTopicSubscription } from '@pocket-tools/terraform-modules/';

import { Construct } from 'constructs';

export class EventLambda extends Construct {
  constructor(
    scope: Construct,
    private name: string,
    config: Pick<SqsLambdaProps, 'vpc'>
  ) {
    super(scope, name.toLowerCase());

    const sqsLambda = new SqsLambda(this, 'Sqs-Event-Consumer', {
      vpc: config.vpc,
      batchSize: 10,
    });
    const lambda = sqsLambda.lambda;

    new ApplicationSqsSnsTopicSubscription(
      this,
      'user-events-sns-subscription',
      {
        name: stackConfig.prefix,
        snsTopicArn: `arn:aws:sns:${config.vpc.region}:${config.vpc.accountId}:${stackConfig.lambda.snsTopicName.userEvents}`,
        sqsQueue: lambda.sqsQueueResource,
        tags: stackConfig.tags,
        dependsOn: [lambda.sqsQueueResource as SqsQueue],
      }
    );
  }
}
