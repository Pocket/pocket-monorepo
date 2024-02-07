resource "aws_sns_topic" "alarm_critical" {
  name = "${local.repo_context.name}-InfrastructureAlarmCritical"
  tags = local.tags
}

resource "aws_sns_topic" "alarm_non_critical" {
  name = "${local.repo_context.name}-InfrastructureAlarmNonCritical"
  tags = local.tags
}

resource "aws_sns_topic_subscription" "infrastructure_alarm_critical" {
  topic_arn                       = aws_sns_topic.alarm_critical.arn
  protocol                        = "https"
  endpoint                        = "https://events.pagerduty.com/integration/${pagerduty_service_integration.cloudwatch_critical.integration_key}/enqueue"
  endpoint_auto_confirms          = true
  confirmation_timeout_in_minutes = 2
  depends_on                      = [
    aws_sns_topic.alarm_critical,
    pagerduty_service_integration.cloudwatch_critical
  ]
}

resource "aws_sns_topic_subscription" "infrastructure_alarm_non_critical" {
  topic_arn                       = aws_sns_topic.alarm_non_critical.arn
  protocol                        = "https"
  endpoint                        = "https://events.pagerduty.com/integration/${pagerduty_service_integration.cloudwatch_non_critical.integration_key}/enqueue"
  endpoint_auto_confirms          = true
  confirmation_timeout_in_minutes = 2
  depends_on                      = [
    aws_sns_topic.alarm_non_critical,
    pagerduty_service_integration.cloudwatch_non_critical
  ]
}

#Already existing DevOps alert Email topic
data "aws_sns_topic" "dev_ops_alerts_email" {
  name = "DevOpsAlerts"
}
