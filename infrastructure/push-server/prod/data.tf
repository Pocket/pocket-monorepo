data "aws_ssm_parameter" "pagerduty_token" {
  name = "${local.circle_prefix}PAGERDUTY_TOKEN"
}

data "aws_ssm_parameter" "service_hash" {
  name = "${local.circle_prefix}SERVICE_HASH"
}

data "aws_ssm_parameter" "private_subnets" {
  name = "/Shared/PrivateSubnets"
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_cloudformation_export" "task_role_arn" {
  name = "${var.iam_stack}-TaskRoleArn"
}

data "aws_cloudformation_export" "task_execution_role_arn" {
  name = "${var.iam_stack}-TaskExecutionRoleArn"
}

data "aws_cloudformation_export" "autoscale_role_arn" {
  name = "${var.iam_stack}-ServiceAutoScalingRoleArn"
}

