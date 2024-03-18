import { Construct } from 'constructs';
import {
  PocketVersionedLambda,
  PocketVersionedLambdaProps,
} from './PocketVersionedLambda.js';
import {
  ApplicationSQSQueue,
  ApplicationSQSQueueProps,
} from '../base/ApplicationSQSQueue.js';
import { ApplicationVersionedLambda } from '../base/ApplicationVersionedLambda.js'
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import {
  DataAwsSqsQueueConfig,
  DataAwsSqsQueue,
} from '@cdktf/provider-aws/lib/data-aws-sqs-queue';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { LambdaEventSourceMapping } from '@cdktf/provider-aws/lib/lambda-event-source-mapping';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';

export interface PocketSQSWithLambdaTargetProps
  extends PocketVersionedLambdaProps {
  /**
   * Set configFromPreexistingSqsQueue to use an existing SQS queue. If not provided, then a queue will be created.
   */
  configFromPreexistingSqsQueue?: DataAwsSqsQueueConfig;
  /**
   * Configure a new SQS queue. Cannot be used in combination with configFromPreexistingSqsQueue.
   */
  sqsQueue?: PocketSQSProps;
  batchSize?: number;
  batchWindow?: number;
  // https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_event_source_mapping#function_response_types
  functionResponseTypes?: string[];
}

export interface PocketSQSProps {
  messageRetentionSeconds?: number;
  maxReceiveCount?: number;
  maxMessageSize?: number;
  delaySeconds?: number;
  visibilityTimeoutSeconds?: number;
}

/**
 * Extends the base pocket versioned lambda class to add a sqs based trigger on top of the lambda
 */
export class PocketSQSWithLambdaTarget extends PocketVersionedLambda {
  public readonly sqsQueueResource: SqsQueue | DataAwsSqsQueue;
  public readonly applicationSqsQueue: ApplicationSQSQueue;

  constructor(
    scope: Construct,
    name: string,
    protected readonly config: PocketSQSWithLambdaTargetProps,
  ) {
    super(scope, name, config);
    PocketSQSWithLambdaTarget.validateEventSourceMappingConfig(config);

    if (config.configFromPreexistingSqsQueue) {
      this.sqsQueueResource = this.getExistingSqsQueue({
        ...config.configFromPreexistingSqsQueue,
      });
    } else {
      this.applicationSqsQueue = this.createSqsQueue({
        ...config.sqsQueue,
        name: `${config.name}-Queue`,
        tags: config.tags,
        provider: this.config.provider,
      });

      this.sqsQueueResource = this.applicationSqsQueue.sqsQueue;
    }

    this.createSQSExecutionPolicyOnLambda(
      this.lambda.lambdaExecutionRole,
      this.sqsQueueResource,
    );

    this.createEventSourceMapping(this.lambda, this.sqsQueueResource, config);
  }

  /**
   * Creates the sqs queue to use with the lambda target
   * @private
   */
  private createSqsQueue(
    sqsQueueConfig: ApplicationSQSQueueProps,
  ): ApplicationSQSQueue {
    return new ApplicationSQSQueue(this, 'lambda_sqs_queue', sqsQueueConfig);
  }

  /**
   * Creates the sqs queue to use with the lambda target
   * @private
   */
  private getExistingSqsQueue(
    sqsQueueConfig: DataAwsSqsQueueConfig,
  ): DataAwsSqsQueue {
    return new DataAwsSqsQueue(this, 'lambda_sqs_queue', sqsQueueConfig);
  }

  /**
   * Validates the event source mapping config.
   * These values are defined by aws here: https://docs.aws.amazon.com/lambda/latest/dg/with-html
   * @param config
   * @private
   */
  private static validateEventSourceMappingConfig(
    config: PocketSQSWithLambdaTargetProps,
  ) {
    if (
      config.batchSize &&
      config.batchSize > 10 &&
      (!config.batchWindow || config.batchWindow < 1)
    ) {
      throw new Error(
        'Maximum batch window in seconds must be greater than 0 if maximum batch size is greater than 10',
      );
    }

    if (config.configFromPreexistingSqsQueue && config.sqsQueue) {
      throw new Error(
        'configFromPreexistingSqsQueue and sqsQueue cannot be used simultaneously.',
      );
    }
  }

  /**
   * Creates the event source mapping for SQS to lambda
   * @param lambda
   * @param sqsQueue
   * @param config
   * @private
   */
  private createEventSourceMapping(
    lambda: ApplicationVersionedLambda,
    sqsQueue: SqsQueue | DataAwsSqsQueue,
    config: PocketSQSWithLambdaTargetProps,
  ) {
    return new LambdaEventSourceMapping(this, `lambda_event_source_mapping`, {
      eventSourceArn: sqsQueue.arn,
      functionName: lambda.versionedLambda.arn,
      batchSize: config.batchSize,
      maximumBatchingWindowInSeconds: config.batchWindow,
      functionResponseTypes: config.functionResponseTypes,
      provider: config.provider,
    });
  }

  /**
   * Allow the Lambda to access the sqs queue
   * @param executionRole
   * @param sqsQueue
   * @private
   */
  private createSQSExecutionPolicyOnLambda(
    executionRole: IamRole,
    sqsQueue: SqsQueue | DataAwsSqsQueue,
  ): IamRolePolicyAttachment {
    const lambdaSqsPolicy = new IamPolicy(this, 'sqs-policy', {
      name: `${this.config.name}-LambdaSQSPolicy`,
      policy: new DataAwsIamPolicyDocument(this, `lambda_sqs_policy`, {
        statement: [
          {
            effect: 'Allow',
            actions: [
              'sqs:SendMessage',
              'sqs:ReceiveMessage',
              'sqs:DeleteMessage',
              'sqs:GetQueueAttributes',
              'sqs:ChangeMessageVisibility',
            ],
            resources: [sqsQueue.arn],
          },
        ],
      }).json,
      dependsOn: [executionRole],
      provider: this.config.provider,
      tags: this.config.tags,
    });

    return new IamRolePolicyAttachment(
      this,
      'execution-role-policy-attachment',
      {
        role: executionRole.name,
        policyArn: lambdaSqsPolicy.arn,
        dependsOn: [executionRole, lambdaSqsPolicy],
        provider: this.config.provider,
      },
    );
  }
}
