resource "aws_cloudwatch_log_group" "queue_users_ecs" {
  name              = "/ecs/${local.name}/${local.env}/QueueUsers/${local.container_name}"
  retention_in_days = 30
}


module "queue_users" {
  source  = "cloudposse/ecs-container-definition/aws"
  version = "0.56.0"

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

  command = ["npm", "run", "task:queue-all-premium-users-for-backfill"]

  log_configuration = {
    logDriver     = "awslogs"
    secretOptions = []

    options = {
      awslogs-region        = data.aws_region.current.name
      awslogs-group         = aws_cloudwatch_log_group.queue_users_ecs.name
      awslogs-stream-prefix = "ecs"
    }
  }

  secrets = local.ecs_secrets

  container_cpu                = null
  container_memory             = null
  container_memory_reservation = null

  environment = [
    {
      name  = "NODE_ENV"
      value = "production"
    },
    {
      name  = "ELASTICSEARCH_HOST"
      value = local.elastic.endpoint
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
      value = aws_sqs_queue.user_items_update_backfill.id
    },
    {
      name  = "SQS_USER_LIST_IMPORT_URL"
      value = aws_sqs_queue.user_list_import_backfill.id
    }
  ]
}

resource "aws_ecs_task_definition" "queue_users" {
  family                = "${local.prefix}-QueueUsers"
  container_definitions = "[${module.queue_users.json_map_encoded}, ${module.xray.json_map_encoded}]"

  task_role_arn      = aws_iam_role.ecs_task_role.arn
  execution_role_arn = aws_iam_role.ecs_execution_role.arn

  network_mode = "awsvpc"

  cpu    = 256
  memory = 512

  requires_compatibilities = [
    "FARGATE"
  ]

  tags = local.tags
}
