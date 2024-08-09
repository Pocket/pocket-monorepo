data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_kinesis_stream" "unified" {
  name = "unified_event"
}

data "aws_kms_alias" "secrets_manager" {
  name = "alias/aws/secretsmanager"
}

data "aws_ssm_parameter" "private_subnets" {
  name = "/Shared/PrivateSubnets"
}

data "aws_ssm_parameter" "sentry_dsn" {
  name = "/${local.name}/${local.env}/SENTRY_DSN"
}

data "aws_ssm_parameter" "parser_privileged_service_id" {
  name = "/${local.name}/${local.env}/PARSER_PRIVILEGED_SERVICE_ID"
}

data "aws_ssm_parameter" "parser_endpoint" {
  name = "/${local.name}/${local.env}/PARSER_ENDPOINT"
}

data "aws_ssm_parameter" "unleash_endpoint" {
  name = "/Shared/${local.env}/UNLEASH_ENDPOINT"
}

data "aws_ssm_parameter" "vpc" {
  name = "/Shared/Vpc"
}

data "aws_vpc" "vpc" {
  id = data.aws_ssm_parameter.vpc.value
}

module "sagemaker" {
  source               = "./modules/sagemaker"
  name_prefix          = "distilbert"
  pytorch_version      = "1.9.1"
  transformers_version = "4.12.3"
  hf_model_id          = "sentence-transformers/msmarco-distilbert-base-tas-b"
  hf_task              = "feature-extraction"
  tags                 = local.tags

  # Development use serverless
  serverless_config = local.workspace.environment == "Dev" ? {
    max_concurrency   = 1
    memory_size_in_mb = 1024
  } : null

  # Production use autoscaling and defined instance type
  instance_type = local.workspace.environment == "Prod" ? "ml.inf1.xlarge" : null
  autoscaling = local.workspace.environment == "Prod" ? {
    min_capacity               = 1
    max_capacity               = 2   # The max capacity of the scalable target
    scaling_target_invocations = 200 # The scaling target invocations (requests/minute)
  } : null
}
