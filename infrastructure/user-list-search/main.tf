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


data "aws_ssm_parameter" "corpus_sentry_dsn" {
  name = "/CorpusSearchLambdas/${local.env}/SENTRY_DSN"
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

module "corpus_embeddings" {
  source = "./corpus-embeddings"
}
