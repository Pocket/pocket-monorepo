import { config } from '../config';
import { PocketPagerDuty } from '@pocket-tools/terraform-modules';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

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
  stack,
  pagerDuty: PocketPagerDuty,
  queueName: string,
  alarmName: string,
  enabled: boolean = true,
  evaluationPeriods = 2,
  periodInSeconds = 900,
  threshold = 15,
) {
  new CloudwatchMetricAlarm(stack, alarmName.toLowerCase(), {
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
    alarmActions: config.isDev ? [] : [pagerDuty.snsNonCriticalAlarmTopic.arn],
    okActions: config.isDev ? [] : [pagerDuty.snsNonCriticalAlarmTopic.arn],
    actionsEnabled: enabled,
  });
}
