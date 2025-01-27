import { config } from '../config/index.ts';
import { cloudwatchMetricAlarm, dataAwsSnsTopic } from '@cdktf/provider-aws';
import { Construct } from 'constructs';

/**
 * Function to create alarms for Dead-letter queues
 * Create a non-critical alarm in prod environment for
 * SQS queue based on the number of messages visible.
 * Default is 15 alerts on 2 evaluation period of 15 minutes.
 * Please pass a more stringent alert for important events.
 * @param stack terraform stack at which the alarm would be created
 * @param queueName dead-letter queue name
 * @param alarmName alarm name (please pass event-rule name to clear description)
 * @param evaluationPeriods
 * @param periodInSeconds
 * @param threshold
 * @param enabled if alarm should act on state changes (pass/fail), defaults to true
 * @private
 */
export function createDeadLetterQueueAlarm(
  stack: Construct,
  snsTopic: dataAwsSnsTopic.DataAwsSnsTopic,
  queueName: string,
  alarmName: string,
  enabled: boolean = true,
  evaluationPeriods = 2,
  periodInSeconds = 900,
  threshold = 15,
) {
  new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
    stack,
    alarmName.toLowerCase(),
    {
      alarmName: `${config.prefix}-${alarmName}`,
      alarmDescription: `Number of messages >= ${threshold}`,
      namespace: 'AWS/SQS',
      metricName: 'ApproximateNumberOfMessagesVisible',
      dimensions: { QueueName: queueName },
      comparisonOperator: 'GreaterThanOrEqualToThreshold',
      evaluationPeriods: evaluationPeriods,
      period: periodInSeconds,
      threshold: threshold,
      statistic: 'Sum',
      // At some point on 10/11/2024, AWS changed the behavior for our dlq alarms and they flop from having 0 messages to missing data.
      treatMissingData: 'notBreaching',
      alarmActions: config.isDev ? [] : [snsTopic.arn],
      okActions: config.isDev ? [] : [snsTopic.arn],
      actionsEnabled: enabled,
    },
  );
}
