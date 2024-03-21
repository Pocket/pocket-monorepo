import { sqsQueue } from '@cdktf/provider-aws';
import { TerraformMetaArguments } from 'cdktf';
import { Construct } from 'constructs';

export interface ApplicationSQSQueueProps extends TerraformMetaArguments {
  /**
   * Name of the sqs queue
   */
  name?: string;
  /**
   * The number of seconds Amazon SQS retains a message.
   */
  messageRetentionSeconds?: number;
  /**
   * How many times a message can be received before it goes to a dead letter queue
   * If not set or set to 0 this will instead max messages constantly retry
   */
  maxReceiveCount?: number;
  /**
   * Max size the SQS message can be. In Bytes
   */
  maxMessageSize?: number;
  /**
   * How long should a message wait before its allowed to be visible to a worker
   */
  delaySeconds?: number;
  /**
   * Once a message is being worked on, how long can the worker hold it.
   */
  visibilityTimeoutSeconds?: number;
  /**
   * How long should a worker be allowed to long poll
   */
  receiveWaitTimeSeconds?: number;
  tags?: { [key: string]: string };
}

/**
 * Defines the validations that we need to perform against our configuration.
 * These values are taken from https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sqs_queue
 */
const validations: {
  [key: string]: {
    min: number;
    max: number;
  };
} = {
  visibilityTimeoutSeconds: {
    min: 0,
    max: 43200,
  },
  messageRetentionSeconds: {
    min: 60,
    max: 1209600,
  },
  maxMessageSize: {
    min: 1024,
    max: 262144,
  },
  delaySeconds: {
    min: 0,
    max: 900,
  },
  receiveWaitTimeSeconds: {
    min: 0,
    max: 20,
  },
};

/**
 * Creates an SQS Queue with a dead letter queue
 */
export class ApplicationSQSQueue extends Construct {
  public readonly sqsQueue: sqsQueue.SqsQueue;
  public deadLetterQueue: sqsQueue.SqsQueue | undefined;

  constructor(
    scope: Construct,
    name: string,
    config: ApplicationSQSQueueProps,
  ) {
    super(scope, name);
    ApplicationSQSQueue.validateConfig(config);
    this.sqsQueue = this.createSQSQueue(config);
  }

  /**
   * Validates the config against the values defined in:
   * https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sqs_queue
   * @param config
   * @private
   */
  private static validateConfig(config: ApplicationSQSQueueProps): void {
    for (const [key, valueToValidate] of Object.entries(config)) {
      if (!(key in validations)) {
        // The key value does not exist in the validations constant so no need to validate it
        continue;
      }

      const { min, max } = validations[key];
      if (valueToValidate < min || valueToValidate > max) {
        throw new Error(
          `${key} can not be greater then ${max} or less then ${min}`,
        );
      }
    }
  }

  private createSQSQueue(config: ApplicationSQSQueueProps) {
    //Have to use the any type because sqsQueue.SqsQueueConfig marks the properties as readonly 🤦🏼‍
    const sqsConfig: any = {
      name: config.name,
      messageRetentionSeconds: config.messageRetentionSeconds,
      maxMessageSize: config.maxMessageSize,
      delaySeconds: config.delaySeconds,
      visibilityTimeoutSeconds: config.visibilityTimeoutSeconds,
      tags: config.tags,
      fifoQueue: false,
      provider: config.provider,
    };

    if (config.maxReceiveCount && config.maxReceiveCount > 0) {
      this.deadLetterQueue = this.createDeadLetterSQSQueue(config);
      sqsConfig.redrivePolicy = JSON.stringify({
        maxReceiveCount: config.maxReceiveCount,
        deadLetterTargetArn: this.deadLetterQueue.arn,
      });
    }

    return new sqsQueue.SqsQueue(this, `sqs_queue`, sqsConfig);
  }

  /**
   * Create a dead letter queue
   * @param config
   * @private
   */
  private createDeadLetterSQSQueue(config: ApplicationSQSQueueProps) {
    return new sqsQueue.SqsQueue(this, `redrive_sqs_queue`, {
      name: `${config.name}-Deadletter`,
      tags: config.tags,
      fifoQueue: false,
      provider: config.provider,
    });
  }
}
