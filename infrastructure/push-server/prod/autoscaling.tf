resource "aws_appautoscaling_target" "service_autoscaling_target" {
  max_capacity       = 10
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.ecs-cluster.name}/${aws_ecs_service.push.name}"
  role_arn           = data.aws_cloudformation_export.autoscale_role_arn.value
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_cloudwatch_metric_alarm" "service_scale_out_alarm" {
  alarm_name          = "Push Service Queue Size Exceeded"
  alarm_description   = "Too many messages pending in the queue"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  period              = 60
  threshold           = 1000
  statistic           = "Sum"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  treat_missing_data  = "notBreaching"
  dimensions          = {
    QueueName = data.aws_sqs_queue.job_queue.name
  }
  alarm_actions       = [
    aws_appautoscaling_policy.service_scale_out_policy.arn
  ]
}

resource "aws_cloudwatch_metric_alarm" "service_scale_in_alarm" {
  alarm_name          = "Push Service Queue Size Reduced"
  alarm_description   = "Only a few messages are in the queue"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  period              = 60
  threshold           = 100
  statistic           = "Sum"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  treat_missing_data  = "notBreaching"
  dimensions          = {
    QueueName = data.aws_sqs_queue.job_queue.name
  }
  alarm_actions       = [
    aws_appautoscaling_policy.service_scale_in_policy.arn
  ]
}


resource "aws_appautoscaling_policy" "service_scale_out_policy" {
  name               = "ScaleOutPolicy"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.service_autoscaling_target.resource_id
  scalable_dimension = aws_appautoscaling_target.service_autoscaling_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.service_autoscaling_target.service_namespace


  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 600
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = 0
      scaling_adjustment          = 2
    }
  }

  depends_on = [
    aws_appautoscaling_target.service_autoscaling_target
  ]
}


resource "aws_appautoscaling_policy" "service_scale_in_policy" {
  name               = "ScaleInPolicy"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.service_autoscaling_target.resource_id
  scalable_dimension = aws_appautoscaling_target.service_autoscaling_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.service_autoscaling_target.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 60
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_upper_bound = 0
      scaling_adjustment          = -1
    }
  }

  depends_on = [
    aws_appautoscaling_target.service_autoscaling_target
  ]
}
