data "aws_ssm_parameter" "vpc" {
  name = "/Shared/Vpc"
}

data "aws_vpc" "vpc" {
  id = data.aws_ssm_parameter.vpc.value
}

resource "aws_ecs_cluster" "ecs-cluster" {
  name = local.repo_context.name
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  tags = local.tags
}

resource "aws_security_group" "ecs_security_group" {
  name        = "${var.service_name}-ECS Security Group"
  description = "Internal security group"
  vpc_id      = data.aws_vpc.vpc.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = -1
    cidr_blocks = [
      "0.0.0.0/0"
    ]
  }

  tags = merge(local.tags, {
    Name = "${var.service_name}-ECS Security Group"
  })
}
