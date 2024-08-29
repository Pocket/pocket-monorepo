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
      value = data.aws_sagemaker_endpoint.model.name
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

/**
 * If you make any changes to the Task Definition this must be called since we ignore changes to it.
 *
 * We typically ignore changes to the following since we rely on BlueGreen Deployments:
 * ALB Default Action Target Group ARN
 * ECS Service LoadBalancer Config
 * ECS Task Definition
 * ECS Placement Strategy Config
 */
resource "null_resource" "apollo_update-task-definition" {
  triggers = {
    task_arn = aws_ecs_task_definition.apollo.arn
  }

  provisioner "local-exec" {
    command = <<EOF
    app_spec_content_string=$(jq -nc \
  --arg container_name "${local.container_name}" \
  --arg container_port "${local.container_port}" \
  --arg task_definition_arn "${aws_ecs_task_definition.apollo.arn}" \
  '{version: 1, Resources: [{TargetService: {Type: "AWS::ECS::Service", Properties: {TaskDefinition: "${aws_ecs_task_definition.apollo.arn}", LoadBalancerInfo: {ContainerName: "${local.container_name}", ContainerPort: ${local.container_port}}}}}]}')

    app_spec_content_sha256=$(echo -n "$app_spec_content_string" | shasum -a 256 | sed 's/ .*$//')

    revision="revisionType=AppSpecContent,appSpecContent={content='$app_spec_content_string',sha256=$app_spec_content_sha256}"

    aws deploy create-deployment \
      --application-name="${aws_codedeploy_app.ecs_codedeploy_app.name}" \
      --deployment-group-name="${aws_codedeploy_deployment_group.apollo_codedeploy_group.deployment_group_name}" \
      --description="Triggered from Terraform/CodeBuild due to a task defintion update" \
      --revision="$revision"
EOF
  }

  depends_on = [
    aws_ecs_service.apollo,
    aws_ecs_task_definition.apollo
  ]

}
