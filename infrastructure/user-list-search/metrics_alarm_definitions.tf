locals {
  alarms = {
    user_item_list_update_processing = {
      name        = "${local.prefix}-UserItemListUpdateProcessingRate"
      description = "The processing rate of UserItemList is currently under ${local.metrics.user_item_update_queue.processing_critical}% (100% is normal)"
      metrics = [
        local.metrics.user_item_update_queue.processed,
        local.metrics.user_item_update_queue.messages_sent,
        local.metrics.user_item_update_queue.messages_deleted
      ]
      threshold         = local.metrics.user_item_update_queue.processing_critical
      operator          = "<"
      return_data_on_id = local.metrics.user_item_update_queue.processed.id
      // Under 10% of our processing rate of the sqs queue (usually 100%) for 1.5 hours
      period        = 1800
      breaches      = 3
      tags          = local.tags
      ok_actions    = []
      alarm_actions = []
    }

    user_item_list_import_processing = {
      name        = "${local.prefix}-UserItemImportProcessingRate"
      description = "The processing rate of UserItemImport is currently under ${local.metrics.user_list_import_queue.processing_critical}%"
      metrics = [
        local.metrics.user_list_import_queue.processed,
        local.metrics.user_list_import_queue.messages_sent,
        local.metrics.user_list_import_queue.messages_deleted
      ]
      threshold         = local.metrics.user_list_import_queue.processing_critical
      operator          = "<"
      return_data_on_id = local.metrics.user_list_import_queue.processed.id
      // Under 10% of our processing rate of the sqs queue (usually 100%) for 1.5 hours
      period        = 1800
      breaches      = 3
      tags          = local.tags
      ok_actions    = []
      alarm_actions = []
    }

    alb_target_error_rate_critical = {
      name        = "${local.prefix}-ApolloALBTargetErrorRateCritical"
      description = "The User List Search ALB Target Error rate is greater than ${local.metrics.apollo_alb.error_rate_critical}%"
      metrics = [
        local.metrics.apollo_alb.total_requests,
        local.metrics.apollo_alb.target_five_xx_requests,
        local.metrics.apollo_alb.target_error_rate,
      ]
      threshold         = local.metrics.apollo_alb.error_rate_critical
      operator          = ">="
      return_data_on_id = local.metrics.apollo_alb.target_error_rate.id
      // >= 25% 5xx error rate for 20 min
      period        = 300
      breaches      = 4
      tags          = local.tags
      ok_actions    = []
      alarm_actions = []
    }

    list_item_update_errors = {
      name        = "${local.prefix}-UserItemUpdateErrors"
      description = "More than 1 error for 3 consecutive minutes"

      metrics = [
        local.metrics.list_item_update_lambda.invocations,
        local.metrics.list_item_update_lambda.concurrent_executions,
        local.metrics.list_item_update_lambda.throttles,
        local.metrics.list_item_update_lambda.errors
      ]

      threshold         = 10
      operator          = ">"
      return_data_on_id = local.metrics.list_item_update_lambda.errors.id
      // The lambda to update users item in elasticsearch is erroring 10 times continuously every 5 min for 15 min.
      period        = 300
      breaches      = 3
      tags          = local.tags
      ok_actions    = []
      alarm_actions = []
    }

    list_item_import_errors = {
      name        = "${local.prefix}-UserListImportErrors"
      description = "More than 1 error for 3 consecutive minutes"

      metrics = [
        local.metrics.list_item_import_lambda.invocations,
        local.metrics.list_item_import_lambda.concurrent_executions,
        local.metrics.list_item_import_lambda.throttles,
        local.metrics.list_item_import_lambda.errors
      ]

      threshold         = 1
      operator          = ">"
      return_data_on_id = local.metrics.list_item_import_lambda.errors.id
      // The lambda that imports new premium users into elasticsearch is erroring 1 times continuously in a 3 min period
      // This is set to a low threshold because users do not activate premium at high volume, so it has to be low to catch an error.
      period        = 60
      breaches      = 3
      tags          = local.tags
      ok_actions    = []
      alarm_actions = []
    }

    event_consumer_lambda_errors = {
      name        = "${local.prefix}-EventConsumerLambdaErrors"
      description = "More than 1 error for 3 consecutive minutes"

      metrics = [
        local.metrics.event_consumer_lambda.duration,
        local.metrics.event_consumer_lambda.iterator_age,
        local.metrics.event_consumer_lambda.errors
      ]

      threshold         = 10
      operator          = ">"
      return_data_on_id = local.metrics.event_consumer_lambda.errors.id
      // The kinesis consumer lambda that we listen on for item updates has more then 10 errors for 10 consecutive minutes
      period        = 60
      breaches      = 10
      tags          = local.tags
      ok_actions    = []
      alarm_actions = []
    }
  }

  # TODO: EventHandler metrics

  #Build arns of the alarms we defined for this service
  alarm_arns = [for v in local.alarms : "arn:aws:cloudwatch:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:alarm:${lookup(v, "name")}"]
}
