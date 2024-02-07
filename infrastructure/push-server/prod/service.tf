resource "aws_cloudwatch_log_group" "push" {
  name              = "/ecs/${var.service_name}/${var.environment}/push"
  retention_in_days = 30
  tags              = local.tags
}

resource "aws_cloudwatch_log_group" "config" {
  name              = "/ecs/${var.service_name}/${var.environment}/config"
  retention_in_days = 30
  tags              = local.tags
}


module "config_agent" {
  source  = "cloudposse/ecs-container-definition/aws"
  version = "0.60.0"

  essential       = true
  container_name  = "config-agent"
  container_image = "pocket/config-agent:dotenv"

  log_configuration = {
    logDriver     = "awslogs"
    secretOptions = []
    options = {
      awslogs-region        = data.aws_region.current.name
      awslogs-group         = aws_cloudwatch_log_group.config.name
      awslogs-stream-prefix = "ecs"
    }
  }

  repository_credentials = {
    credentialsParameter : local.container_credential
  }

  command = [
    "./agent.sh",
    "/${var.service_name}/${var.environment}",
    "/config/.env"
  ]

  mount_points = [
    {
      containerPath = "/config"
      sourceVolume  = "config"
    }
  ]
  port_mappings                = []
  container_cpu                = null
  container_memory             = null
  container_memory_reservation = null
}

data "aws_ecr_repository" "push" {
  name = var.ecr_repository_name
}

data "aws_ecr_image" "push" {
  repository_name = data.aws_ecr_repository.push.name
  image_tag       = local.service_hash
}

module "push" {
  source  = "cloudposse/ecs-container-definition/aws"
  version = "0.60.0"

  essential       = true
  container_name  = "push"
  container_image = "${data.aws_ecr_repository.push.repository_url}:${data.aws_ecr_image.push.image_tag}"

  log_configuration = {
    logDriver     = "awslogs"
    secretOptions = []
    options = {
      awslogs-region        = data.aws_region.current.name
      awslogs-group         = aws_cloudwatch_log_group.push.name
      awslogs-stream-prefix = "ecs"
    }
  }

  environment = [
    {
      name  = "DOTENV_CONFIG_PATH"
      value = "/config/.env"
    }
  ]

  mount_points = [
    {
      readOnly      = true
      containerPath = "/config"
      sourceVolume  = "config"
    }
  ]
  container_cpu                = null
  container_memory             = null
  container_memory_reservation = null
}

resource "aws_ecs_task_definition" "push" {
  family             = "push-notifications"
  task_role_arn      = data.aws_cloudformation_export.task_role_arn.value
  execution_role_arn = data.aws_cloudformation_export.task_execution_role_arn.value
  network_mode       = "awsvpc"
  cpu                = 2048
  memory             = 4096
  volume {
    name = "config"
  }
  container_definitions = "[${module.push.json_map_encoded},${module.config_agent.json_map_encoded}]"
  tags                  = local.tags
}

resource "random_id" "service_name" {
  keepers = {
    version = "v3"
  }

  prefix = "PushNotifications"

  byte_length = 8
}


resource "aws_ecs_service" "push" {
  name            = random_id.service_name.hex
  task_definition = aws_ecs_task_definition.push.arn
  cluster         = aws_ecs_cluster.ecs-cluster.name
  network_configuration {
    subnets = split(",", data.aws_ssm_parameter.private_subnets.value)
  }
  launch_type                        = "FARGATE"
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  desired_count                      = 1
  propagate_tags                     = "SERVICE"
  tags                               = local.tags
  lifecycle {
    ignore_changes = [
      desired_count
    ]
    create_before_destroy = true
  }
}

resource "null_resource" "update-service" {
  triggers = {
    arn = aws_ecs_service.push.id
  }

  provisioner "local-exec" {
    command = "sleep 300"
  }
}
