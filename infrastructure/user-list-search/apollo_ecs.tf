resource "aws_cloudwatch_log_group" "apollo_ecs" {
  name              = "/ecs/${local.name}/${local.env}/Apollo/${local.container_name}"
  retention_in_days = 30
}

###
# If a change is made here it will trigger a code deploy deployment below.
###
module "apollo" {
  source  = "cloudposse/ecs-container-definition/aws"
  version = "0.61.1"

  essential       = true
  container_name  = local.container_name
  container_image = "${aws_ecr_repository.ecr_repo.repository_url}:latest"
  port_mappings = [
    {
      hostPort      = local.container_port
      containerPort = local.container_port
      protocol      = "tcp"
    }
  ]

  log_configuration = {
    logDriver     = "awslogs"
    secretOptions = []

    options = {
      awslogs-region        = data.aws_region.current.name
      awslogs-group         = aws_cloudwatch_log_group.apollo_ecs.name
      awslogs-stream-prefix = "ecs"
    }
  }

  container_cpu                = null
  container_memory             = null
  container_memory_reservation = null

  secrets = local.ecs_secrets

  environment = [
    {
      name  = "NODE_ENV"
      value = local.workspace.nodeEnv
    },
    {
      name  = "ELASTICSEARCH_HOST"
      value = local.elastic.endpoint
    },
    {
      name  = "ELASTICSEARCH_INDEX"
      value = local.elastic_index
    },
    {
      name  = "EVENT_BUS_NAME"
      value = local.event_bus_name
    },
    {
      name  = "CORPUS_INDEX_EN"
      value = local.corpus_index_en
    },
    {
      name  = "CORPUS_INDEX_ES"
      value = local.corpus_index_es
    },
    {
      name  = "CORPUS_INDEX_IT"
      value = local.corpus_index_it
    },
    {
      name  = "CORPUS_INDEX_FR"
      value = local.corpus_index_fr
    },
    {
      name  = "CORPUS_INDEX_DE"
      value = local.corpus_index_de
    },
    {
      name  = "ELASTICSEARCH_DOMAIN"
      value = local.elastic.domain_name
    },
    {
      name  = "AWS_SQS_ENDPOINT"
      value = local.sqsEndpoint
    },
    {
      name  = "AWS_APP_PREFIX"
      value = local.prefix
    },
    {
      name  = "SQS_USER_ITEMS_UPDATE_URL"
      value = aws_sqs_queue.user_items_update.id
    },
    {
      name  = "SQS_USER_LIST_IMPORT_BACKFILL_URL"
      value = aws_sqs_queue.user_list_import_backfill.id
    },
    {
      name  = "SQS_USER_ITEMS_UPDATE_BACKFILL_URL"
      value = aws_sqs_queue.user_items_update_backfill.id
    },
    {
      name  = "EMBEDDINGS_ENDPOINT"
      value = module.corpus_embeddings.sagemaker_endpoint_name
    },
    {
      name  = "CORPUS_SEARCH_DOMAIN"
      value = module.corpus_embeddings.opensearch_domain_name
    },
    {
      name  = "CORPUS_SEARCH_ENDPOINT"
      value = module.corpus_embeddings.opensearch_endpoint
    }
  ]
}

resource "aws_ecs_task_definition" "apollo" {
  family                = "${local.prefix}-Apollo"
  container_definitions = "[${module.apollo.json_map_encoded}, ${module.otel.json_map_encoded}]"

  task_role_arn      = aws_iam_role.ecs_task_role.arn
  execution_role_arn = aws_iam_role.ecs_execution_role.arn

  network_mode = "awsvpc"

  cpu    = 512
  memory = 2048

  requires_compatibilities = [
    "FARGATE"
  ]

  tags = local.tags
}

output "ecs-task-family" {
  description = "ECS Task Family"
  value       = aws_ecs_task_definition.apollo.family
}

output "ecs-task-containerPort" {
  description = "ECS Task Container Port"
  value       = local.container_port
}

output "ecs-task-containerName" {
  description = "ECS Task Container Name"
  value       = local.container_name
}

output "ecs-task-arn" {
  description = "ECS Task Arn"
  value       = aws_ecs_task_definition.apollo.arn
}

output "ecs-serviceName" {
  description = "ECS Service Name"
  value       = aws_ecs_service.apollo.name
}
output "ecs-clusterName" {
  description = "ECS Cluster Name"
  value       = aws_ecs_cluster.ecs_cluster.name
}

output "ecs-application-url" {
  description = "ECS Application URL"
  value       = local.workspace.domain
}

resource "aws_ecs_service" "apollo" {
  name            = "Apollo"
  task_definition = aws_ecs_task_definition.apollo.arn
  deployment_controller {
    type = "CODE_DEPLOY"
  }

  launch_type = "FARGATE"

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  desired_count = 2

  lifecycle {
    ignore_changes = [
      task_definition,
      desired_count,
      load_balancer
    ]
    create_before_destroy = true
  }

  tags = local.tags

  cluster = aws_ecs_cluster.ecs_cluster.arn

  load_balancer {
    container_name   = local.container_name
    container_port   = local.container_port
    target_group_arn = aws_alb_target_group.alb_target.arn
  }

  network_configuration {
    subnets = split(",", data.aws_ssm_parameter.private_subnets.value)
    security_groups = [
      aws_security_group.ecs_security_group.id
    ]
  }

  propagate_tags = "SERVICE"

  depends_on = [
    aws_security_group.ecs_security_group,
    aws_alb_target_group.alb_target,
    aws_alb_target_group.alb_target_green,
    aws_alb.alb,
    aws_alb_listener.listener_https,
    aws_ecs_cluster.ecs_cluster
  ]
}
