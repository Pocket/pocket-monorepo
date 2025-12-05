module "dashboard_alarm" {
  source = "github.com/Pocket/terraform-pocket-metrics-alerting?ref=0.1.3"
  dashboards = {
    "sla" = {
      name = local.prefix
      widgets = [
        {
          x      = 0.0
          y      = 0.0
          width  = 12.0
          height = 6.0
          properties = {
            title   = "ALB Apollo Response Time"
            stacked = true
            region  = data.aws_region.current.name,
            stat    = "p95"
            period  = 60
          }
          metrics = [
            local.metrics.apollo_alb.target_response_time_p95,
            local.metrics.apollo_alb.target_response_time_p99,
            local.metrics.apollo_alb.target_response_time_average,
          ]
        },
        {
          x      = 12.0
          y      = 0.0
          width  = 12.0
          height = 6.0
          properties = {
            title   = "Apollo ALB HTTP Requests"
            stacked = true
            region  = data.aws_region.current.name,
            stat    = "Sum"
            period  = 60,
            annotations = {
              horizontal = [
                {
                  label = "Error Rate Critical"
                  value = local.metrics.apollo_alb.error_rate_critical
                  yAxis = "right"
                  color = "#d62728"
                },
                {
                  label = "Error Rate High"
                  value = local.metrics.apollo_alb.error_rate_non_critical
                  yAxis = "right"
                  color = "#ff7f0e"
                }
              ]
            }
          }
          metrics = [
            merge(local.metrics.apollo_alb.total_requests, { metadata = { color = "#1f77b4" } }),
            merge(local.metrics.apollo_alb.two_xx_requests, { metadata = { color = "#2ca02c" } }),
            merge(local.metrics.apollo_alb.target_five_xx_requests, { metadata = { color = "#d62728" } }),
            merge(local.metrics.apollo_alb.elb_five_xx_requests, { metadata = { color = "#ff7f0e" } }),
            merge(local.metrics.apollo_alb.target_error_rate, {
              metadata = {
                label = "ALB Target Error Rate"
                yAxis = "right"
                color = "#d62728"
              }
            }),
            merge(local.metrics.apollo_alb.elb_error_rate, {
              metadata = {
                label = "ELB Error Rate"
                yAxis = "right"
                color = "#ff7f0e"
              }
            })
          ]
        },
        {
          x      = 0.0
          y      = 6.0
          width  = 12.0
          height = 6.0
          properties = {
            title   = "UserItems Messages Throughput (Kinesis)"
            stacked = false
            region  = data.aws_region.current.name,
            stat    = "Sum"
            period  = 60
            annotations = {
              horizontal = [
                {
                  label = "Processing Rate Critical"
                  value = local.metrics.user_item_update_queue.processing_critical
                  yAxis = "right"
                  color = "#d62728"
                },
                {
                  label = "Processing Rate High"
                  value = local.metrics.user_item_update_queue.processing_non_critical
                  yAxis = "right"
                  color = "#ff7f0e"
                }
              ]
            }
          }
          metrics = [
            local.metrics.user_item_update_queue.messages_sent,
            local.metrics.user_item_update_queue.messages_deleted,
            merge(local.metrics.user_item_update_queue.processed, {
              metadata = {
                label = "UserItemUpdate Process Rate"
                yAxis = "right"
              }
            }),
            local.metrics.user_item_update_queue.messages_visible,
          ]

        },
        {
          x      = 12.0
          y      = 6.0
          width  = 12.0
          height = 6.0
          properties = {
            title   = "UserListImport Throughput (Kinesis Premium Activations)"
            stacked = false
            region  = data.aws_region.current.name,
            stat    = "Sum"
            period  = 60
            annotations = {
              horizontal = [
                {
                  label = "Processing Rate Critical"
                  value = local.metrics.user_list_import_queue.processing_critical
                  yAxis = "right"
                  color = "#d62728"
                },
                {
                  label = "Processing Rate High"
                  value = local.metrics.user_list_import_queue.processing_non_critical
                  yAxis = "right"
                  color = "#ff7f0e"
                }
              ]
            }
          }
          metrics = [
            local.metrics.user_list_import_queue.messages_sent,
            local.metrics.user_list_import_queue.messages_deleted,
            merge(local.metrics.user_list_import_queue.processed, {
              metadata = {
                label = "UserListImport Process Rate"
                yAxis = "right"
              }
            }),
            local.metrics.user_list_import_queue.messages_visible,
          ]
        },
        {
          x      = 12.0
          y      = 18.0
          width  = 12.0
          height = 6.0
          properties = {
            title   = "Lambda (Kinesis)"
            stacked = false
            region  = data.aws_region.current.name,
            stat    = "Average"
            period  = 60
          }
          metrics = [
            merge(local.metrics.list_item_import_lambda.invocations, { metadata = { color = "#1f77b4" } }),
            merge(local.metrics.list_item_import_lambda.errors, { metadata = { color = "#d62728" } }),
            merge(local.metrics.list_item_import_lambda.concurrent_executions, { metadata = { color = "#2ca02c" } }),
            merge(local.metrics.list_item_import_lambda.throttles, { metadata = { color = "#ff7f0e" } }),

            merge(local.metrics.list_item_update_lambda.invocations, { metadata = { color = "#1f77b4", yAxis = "right" } }),
            merge(local.metrics.list_item_update_lambda.errors, { metadata = { color = "#d62728", yAxis = "right" } }),
            merge(local.metrics.list_item_update_lambda.concurrent_executions, { metadata = { color = "#2ca02c", yAxis = "right" } }),
            merge(local.metrics.list_item_update_lambda.throttles, { metadata = { color = "#ff7f0e", yAxis = "right" } }),
          ]
        },
        {
          x      = 0.0
          y      = 24.0
          width  = 12.0
          height = 6.0
          properties = {
            title   = "Event Kinesis Consumer"
            stacked = false
            region  = data.aws_region.current.name,
            stat    = "Average"
            period  = 60
          }
          metrics = [
            local.metrics.event_consumer_lambda.duration,
            local.metrics.event_consumer_lambda.errors,
            merge(local.metrics.event_consumer_lambda.iterator_age, { metadata = { yAxis = "right" } })
          ]

        },
        {
          x      = 12.0
          y      = 24.0
          width  = 12.0
          height = 6.0
          properties = {
            title   = "Lambda (Seperate Backfill Process)"
            stacked = false
            region  = data.aws_region.current.name,
            stat    = "Average"
            period  = 60
          }
          metrics = [
            merge(local.metrics.list_item_import_backfill_lambda.invocations, { metadata = { color = "#1f77b4" } }),
            merge(local.metrics.list_item_import_backfill_lambda.errors, { metadata = { color = "#d62728" } }),
            merge(local.metrics.list_item_import_backfill_lambda.concurrent_executions, { metadata = { color = "#2ca02c" } }),
            merge(local.metrics.list_item_import_backfill_lambda.throttles, { metadata = { color = "#ff7f0e" } }),

            merge(local.metrics.list_item_update_backfill_lambda.invocations, { metadata = { color = "#1f77b4", yAxis = "right" } }),
            merge(local.metrics.list_item_update_backfill_lambda.errors, { metadata = { color = "#d62728", yAxis = "right" } }),
            merge(local.metrics.list_item_update_backfill_lambda.concurrent_executions, { metadata = { color = "#2ca02c", yAxis = "right" } }),
            merge(local.metrics.list_item_update_backfill_lambda.throttles, { metadata = { color = "#ff7f0e", yAxis = "right" } }),
          ]
        },
        {
          x      = 0.0
          y      = 30.0
          width  = 24.0
          height = 6.0
          type   = "alarm"
          properties = {
            title  = "Alarms"
            region = data.aws_region.current.name,
          }
          alarms = local.alarm_arns
        }
      ]
    }
  }

  metric_alarms = local.alarms
}
