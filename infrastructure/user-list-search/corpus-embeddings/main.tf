data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_kms_alias" "secrets_manager" {
  name = "alias/aws/secretsmanager"
}

data "aws_ssm_parameter" "private_subnets" {
  name = "/Shared/PrivateSubnets"
}

data "aws_ssm_parameter" "vpc" {
  name = "/Shared/Vpc"
}

data "aws_vpc" "vpc" {
  id = data.aws_ssm_parameter.vpc.value
}