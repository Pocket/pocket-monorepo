locals {
  ecs_secrets = [
    {
      // FarGate Does not allow for specifying json-keys from an AWS Secret yet :(
      // We Need to parse the json of this in code.
      name      = "READITLA_DB"
      valueFrom = "${local.secret_path}DatabaseCredentials"
    },
    {
      name      = "CONTENT_AURORA_DB"
      valueFrom = "${local.secret_path}ParserAuroraDbCredentials"
    },
    {
      name      = "SENTRY_DSN"
      valueFrom = "${local.ssm_path}SENTRY_DSN"
    }
  ]
}

resource "aws_ecr_repository" "ecr_repo" {
  name = lower(local.prefix)
  image_scanning_configuration {
    scan_on_push = true
  }
  tags = local.tags
}

resource "aws_ecr_lifecycle_policy" "old_images_policy" {
  repository = aws_ecr_repository.ecr_repo.name

  policy = <<EOF
{
  "rules": [
      {
          "rulePriority": 1,
          "description": "expire old images",
          "selection": {
              "tagStatus": "any",
              "countType": "imageCountMoreThan",
              "countNumber": 800
          },
          "action": {
              "type": "expire"
          }
      }
  ]
}
EOF
}

resource "aws_ecs_cluster" "ecs_cluster" {
  name = local.prefix
  tags = local.tags

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_security_group" "ecs_security_group" {
  name        = "${local.prefix}-ECSSecurityGroup"
  description = "Internal security group"
  vpc_id      = data.aws_vpc.vpc.id

  ingress {
    from_port = 80
    protocol  = "TCP"
    to_port   = local.container_port

    security_groups = [
      aws_security_group.alb_security_group.id
    ]
  }

  egress {
    from_port   = 0
    protocol    = -1
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags

  depends_on = [aws_security_group.alb_security_group]
}

resource "aws_cloudwatch_log_group" "xray" {
  name              = "/ecs/${local.name}/${local.env}/xray"
  retention_in_days = 30
}

module "xray" {
  source  = "cloudposse/ecs-container-definition/aws"
  version = "0.56.0"

  essential       = true
  container_name  = "xray"
  container_image = "amazon/aws-xray-daemon"
  command = [
    "--region",
    "us-east-1",
    "--local-mode"
  ]

  repository_credentials = {
    credentialsParameter : local.container_credential
  }

  log_configuration = {
    logDriver     = "awslogs"
    secretOptions = []
    options = {
      awslogs-region        = data.aws_region.current.name
      awslogs-group         = aws_cloudwatch_log_group.xray.name
      awslogs-stream-prefix = "ecs"
    }
  }

  port_mappings = [
    {
      containerPort = 2000
      hostPort      = 2000
      protocol      = "udp"
    }
  ]
  container_cpu                = null
  container_memory             = null
  container_memory_reservation = null
}
