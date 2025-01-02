locals {
  metrics = {
    user_item_update_queue = {
      processing_critical     = 10
      processing_non_critical = 20
      messages_visible = {
        id        = "user_item_update_queue_messages_visible"
        namespace = "AWS/SQS"
        metric    = "ApproximateNumberOfMessagesVisible"
        statistic = "Sum"
        dimensions = {
          QueueName = aws_sqs_queue.user_items_update.name
        }
      },
      messages_deleted = {
        id        = "user_item_update_queue_messages_deleted"
        namespace = "AWS/SQS"
        metric    = "NumberOfMessagesDeleted"
        statistic = "Sum"
        dimensions = {
          QueueName = aws_sqs_queue.user_items_update.name
        }
      },
      messages_sent = {
        id        = "user_item_update_queue_messages_sent"
        namespace = "AWS/SQS"
        metric    = "NumberOfMessagesSent"
        statistic = "Sum"
        dimensions = {
          QueueName = aws_sqs_queue.user_items_update.name
        }
      }
      processed = {
        id         = "user_item_update_queue_messages_processed"
        expression = "IF(user_item_update_queue_messages_deleted, user_item_update_queue_messages_deleted, 1)/IF(user_item_update_queue_messages_sent, user_item_update_queue_messages_sent, 1)*100",
      }
    },
    user_list_import_queue = {
      processing_critical     = 10
      processing_non_critical = 20
      messages_visible = {
        id        = "user_list_import_queue_messages_visible"
        namespace = "AWS/SQS"
        metric    = "ApproximateNumberOfMessagesVisible"
        statistic = "Sum"
        dimensions = {
          QueueName = aws_sqs_queue.user_list_import.name
        }
      }
      messages_deleted = {
        id        = "user_list_import_queue_messages_deleted"
        namespace = "AWS/SQS"
        metric    = "NumberOfMessagesDeleted"
        statistic = "Sum"
        dimensions = {
          QueueName = aws_sqs_queue.user_list_import.name
        }
      },
      messages_sent = {
        id        = "user_list_import_queue_messages_sent"
        namespace = "AWS/SQS"
        metric    = "NumberOfMessagesSent"
        statistic = "Sum"
        dimensions = {
          QueueName = aws_sqs_queue.user_list_import.name
        }
      }
      processed = {
        id         = "user_list_import_queue_messages_processed"
        expression = "IF(user_list_import_queue_messages_deleted, user_list_import_queue_messages_deleted, 1)/IF(user_list_import_queue_messages_sent, user_list_import_queue_messages_sent, 1)*100",
      }
    }

    list_item_import_lambda = {
      invocations = {
        id        = "list_item_import_lambda_invocations"
        namespace = "AWS/Lambda"
        metric    = "Invocations"
        statistic = "Sum"
        dimensions = {
          FunctionName = aws_lambda_function.user_list_import_sqs_processor.function_name
        }
      }
      errors = {
        id        = "list_item_import_lambda_errors"
        namespace = "AWS/Lambda"
        metric    = "Errors"
        statistic = "Sum"
        dimensions = {
          FunctionName = aws_lambda_function.user_list_import_sqs_processor.function_name
        }
      },
      concurrent_executions = {
        id        = "list_item_import_lambda_concurrent_executions"
        namespace = "AWS/Lambda"
        metric    = "ConcurrentExecutions"
        statistic = "Sum"
        dimensions = {
          FunctionName = aws_lambda_function.user_list_import_sqs_processor.function_name
        }
      },
      throttles = {
        id        = "list_item_import_lambda_throttles"
        namespace = "AWS/Lambda"
        metric    = "Throttles"
        statistic = "Sum"
        dimensions = {
          FunctionName = aws_lambda_function.user_list_import_sqs_processor.function_name
        }
      }
    }

    list_item_import_backfill_lambda = {
      invocations = {
        id        = "list_item_import_backfill_lambda_invocations"
        namespace = "AWS/Lambda"
        metric    = "Invocations"
        statistic = "Sum"
        dimensions = {
          FunctionName = aws_lambda_function.user_list_import_backfill_sqs_processor.function_name
        }
      }
      errors = {
        id        = "list_item_import_backfill_lambda_errors"
        namespace = "AWS/Lambda"
        metric    = "Errors"
        statistic = "Sum"
        dimensions = {
          FunctionName = aws_lambda_function.user_list_import_backfill_sqs_processor.function_name
        }
      },
      concurrent_executions = {
        id        = "list_item_import_backfill_lambda_concurrent_executions"
        namespace = "AWS/Lambda"
        metric    = "ConcurrentExecutions"
        statistic = "Sum"
        dimensions = {
          FunctionName = aws_lambda_function.user_list_import_backfill_sqs_processor.function_name
        }
      },
      throttles = {
        id        = "list_item_import_backfill_lambda_throttles"
        namespace = "AWS/Lambda"
        metric    = "Throttles"
        statistic = "Sum"
        dimensions = {
          FunctionName = aws_lambda_function.user_list_import_backfill_sqs_processor.function_name
        }
      }
    }

    list_item_update_lambda = {
      invocations = {
        id        = "list_item_update_lambda_invocations"
        namespace = "AWS/Lambda"
        metric    = "Invocations"
        statistic = "Sum"
        dimensions = {
          FunctionName = aws_lambda_function.item_update_sqs_processor.function_name
        }
      }
      errors = {
        id        = "list_item_update_lambda_errors"
        namespace = "AWS/Lambda"
        metric    = "Errors"
        statistic = "Sum"
        dimensions = {
          FunctionName = aws_lambda_function.item_update_sqs_processor.function_name
        }
      },
      concurrent_executions = {
        id        = "list_item_update_lambda_concurrent_executions"
        namespace = "AWS/Lambda"
        metric    = "ConcurrentExecutions"
        statistic = "Sum"
        dimensions = {
          FunctionName = aws_lambda_function.item_update_sqs_processor.function_name
        }
      },
      throttles = {
        id        = "list_item_update_lambda_throttles"
        namespace = "AWS/Lambda"
        metric    = "Throttles"
        statistic = "Sum"
        dimensions = {
          FunctionName = aws_lambda_function.item_update_sqs_processor.function_name
        }
      }
    }

    list_item_update_backfill_lambda = {
      invocations = {
        id        = "list_item_update_backfill_lambda_invocations"
        namespace = "AWS/Lambda"
        metric    = "Invocations"
        statistic = "Sum"
        dimensions = {
          FunctionName = aws_lambda_function.item_update_backfill_sqs_processor.function_name
        }
      }
      errors = {
        id        = "list_item_update_backfill_lambda_errors"
        namespace = "AWS/Lambda"
        metric    = "Errors"
        statistic = "Sum"
        dimensions = {
          FunctionName = aws_lambda_function.item_update_backfill_sqs_processor.function_name
        }
      },
      concurrent_executions = {
        id        = "list_item_update_backfill_lambda_concurrent_executions"
        namespace = "AWS/Lambda"
        metric    = "ConcurrentExecutions"
        statistic = "Sum"
        dimensions = {
          FunctionName = aws_lambda_function.item_update_backfill_sqs_processor.function_name
        }
      },
      throttles = {
        id        = "list_item_update_backfill_lambda_throttles"
        namespace = "AWS/Lambda"
        metric    = "Throttles"
        statistic = "Sum"
        dimensions = {
          FunctionName = aws_lambda_function.item_update_backfill_sqs_processor.function_name
        }
      }
    }
    apollo_ecs = {
      cpu_utilization = {
        id        = "apollo_ecs_cpu_utilization"
        namespace = "AWS/ECS"
        metric    = "CPUUtilization"
        statistic = "Average"
        dimensions = {
          ServiceName = aws_ecs_service.apollo.name
          ClusterName = aws_ecs_cluster.ecs_cluster.name
        }
      },
      memory_utilization = {
        id        = "apollo_ecs_memory_utilization"
        namespace = "AWS/ECS"
        metric    = "MemoryUtilization"
        statistic = "Average"
        dimensions = {
          ServiceName = aws_ecs_service.apollo.name
          ClusterName = aws_ecs_cluster.ecs_cluster.name
        }
      }
    }
    elasticsearch = {
      searchable_documents = {
        id        = "elasticsearch_searchable_documents"
        namespace = "AWS/ES"
        metric    = "SearchableDocuments"
        statistic = "Sum"
        dimensions = {
          DomainName = local.elastic.domain_name
          ClientId   = data.aws_caller_identity.current.account_id
        }
      },

      cluster_index_write_blocked = {
        id        = "elasticsearch_cluster_index_write_blocked"
        namespace = "AWS/ES"
        metric    = "ClusterIndexWritesBlocked"
        statistic = "Sum"
        dimensions = {
          DomainName = local.elastic.domain_name
          ClientId   = data.aws_caller_identity.current.account_id
        }
      },

      free_storage = {
        id        = "elasticsearch_free_storage"
        namespace = "AWS/ES"
        metric    = "FreeStorageSpace"
        statistic = "Sum"
        dimensions = {
          DomainName = local.elastic.domain_name
          ClientId   = data.aws_caller_identity.current.account_id
        }
      },

      indexing_rate = {
        id        = "elasticsearch_indexing_rate"
        namespace = "AWS/ES"
        metric    = "IndexingRate"
        statistic = "Sum"
        dimensions = {
          DomainName = local.elastic.domain_name
          ClientId   = data.aws_caller_identity.current.account_id
        }
      },

      indexing_latency = {
        id        = "elasticsearch_indexing_latency"
        namespace = "AWS/ES"
        metric    = "IndexingLatency"
        statistic = "Sum"
        dimensions = {
          DomainName = local.elastic.domain_name
          ClientId   = data.aws_caller_identity.current.account_id
        }
      },

      two_xx_requests = {
        id        = "elasticsearch_two_xx_requests"
        namespace = "AWS/ES"
        metric    = "2xx"
        statistic = "Sum"
        dimensions = {
          DomainName = local.elastic.domain_name
          ClientId   = data.aws_caller_identity.current.account_id
        }
      },
      three_xx_requests = {
        id        = "elasticsearch_tthree_xx_requests"
        namespace = "AWS/ES"
        metric    = "3xx"
        statistic = "Sum"
        dimensions = {
          DomainName = local.elastic.domain_name
          ClientId   = data.aws_caller_identity.current.account_id
        }
      },

      four_xx_requests = {
        id        = "elasticsearch_four_xx_requests"
        namespace = "AWS/ES"
        metric    = "4xx"
        statistic = "Sum"
        dimensions = {
          DomainName = local.elastic.domain_name
          ClientId   = data.aws_caller_identity.current.account_id
        }
      },
      five_xx_requests = {
        id        = "elasticsearch_five_xx_requests"
        namespace = "AWS/ES"
        metric    = "5xx"
        statistic = "Sum"
        dimensions = {
          DomainName = local.elastic.domain_name
          ClientId   = data.aws_caller_identity.current.account_id
        }
      },
    }
    apollo_alb = {
      error_rate_critical     = 25
      error_rate_non_critical = 15
      total_requests = {
        id        = "apollo_alb_total_requests"
        namespace = "AWS/ApplicationELB"
        metric    = "RequestCount"
        statistic = "Sum"
        dimensions = {
          LoadBalancer = aws_alb.alb.arn_suffix
        }
      }
      two_xx_requests = {
        id        = "apollo_alb_two_xx_requests"
        namespace = "AWS/ApplicationELB"
        metric    = "HTTPCode_Target_2XX_Count"
        statistic = "Sum"
        dimensions = {
          LoadBalancer = aws_alb.alb.arn_suffix
        }
      },
      target_five_xx_requests = {
        id        = "apollo_alb_target_five_xx_requests"
        namespace = "AWS/ApplicationELB"
        metric    = "HTTPCode_Target_5XX_Count"
        statistic = "Sum"
        dimensions = {
          LoadBalancer = aws_alb.alb.arn_suffix
        }
      },
      elb_five_xx_requests = {
        id        = "apollo_elb_five_xx_requests"
        namespace = "AWS/ApplicationELB"
        metric    = "HTTPCode_ELB_5XX_Count"
        statistic = "Sum"
        dimensions = {
          LoadBalancer = aws_alb.alb.arn_suffix
        }
      },
      target_error_rate = {
        id         = "apollo_alb_target_error_rate"
        expression = "IF(apollo_alb_target_five_xx_requests, apollo_alb_target_five_xx_requests, 0)/IF(apollo_alb_total_requests, apollo_alb_total_requests, 1)*100",
      },
      elb_error_rate = {
        id         = "apollo_elb_error_rate"
        expression = "IF(apollo_elb_five_xx_requests, apollo_elb_five_xx_requests, 0)/IF(apollo_alb_total_requests, apollo_alb_total_requests, 1)*100",
      },
      target_response_time_p95 = {
        id        = "apollo_alb_target_response_time_p95"
        namespace = "AWS/ApplicationELB"
        metric    = "TargetResponseTime"
        statistic = "p95"
        dimensions = {
          LoadBalancer = aws_alb.alb.arn_suffix
        }
      }
      target_response_time_p99 = {
        id        = "apollo_alb_target_response_time_p99"
        namespace = "AWS/ApplicationELB"
        metric    = "TargetResponseTime"
        statistic = "p99"
        dimensions = {
          LoadBalancer = aws_alb.alb.arn_suffix
        }
      }
      target_response_time_average = {
        id        = "apollo_alb_target_response_time_average"
        namespace = "AWS/ApplicationELB"
        metric    = "TargetResponseTime"
        statistic = "Average"
        dimensions = {
          LoadBalancer = aws_alb.alb.arn_suffix
        }
      }
    },
  }
}
