resource "aws_codedeploy_app" "lambda_unified_events_consumer" {
  compute_platform = "Lambda"
  name             = "${local.prefix}-UnifiedEventsConsumer"
}

resource "aws_iam_role" "lambda_codedeploy_role" {
  name               = "${local.prefix}-LambdaCodeDeployRole"
  assume_role_policy = data.aws_iam_policy_document.codedeploy_assume_role.json
}

resource "aws_iam_role_policy_attachment" "lambda_codedeploy_role" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForLambda"
  #Depending on the service there are different types.
  role = aws_iam_role.lambda_codedeploy_role.name
}

resource "aws_codedeploy_deployment_group" "lambda_unified_events_consumer" {
  app_name               = aws_codedeploy_app.lambda_unified_events_consumer.name
  deployment_config_name = "CodeDeployDefault.LambdaAllAtOnce"
  deployment_group_name  = "${local.prefix}-UnifiedEventsConsumer"
  service_role_arn       = aws_iam_role.lambda_codedeploy_role.arn

  deployment_style {
    deployment_type   = "BLUE_GREEN"
    deployment_option = "WITH_TRAFFIC_CONTROL"
  }

  auto_rollback_configuration {
    enabled = true
    events = [
      "DEPLOYMENT_FAILURE"
    ]
  }
}

resource "aws_codestarnotifications_notification_rule" "lambda_unified_events_consumer_notifications" {
  detail_type = "BASIC"
  event_type_ids = [
    "codedeploy-application-deployment-failed",
  ]

  name     = aws_codedeploy_app.lambda_unified_events_consumer.name
  resource = "arn:aws:codedeploy:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:application:${aws_codedeploy_app.lambda_unified_events_consumer.name}"

  target {
    address = data.aws_sns_topic.backend-deploy-topic.arn
  }
}

resource "aws_s3_bucket" "lambda_unified_events_consumer_code_bucket" {
  bucket = "pocket-${lower(local.prefix)}-kinesis-consumer"
  tags   = local.tags
}

resource "aws_s3_bucket_acl" "lambda_unified_events_consumer_code_bucket" {
  acl    = "private"
  bucket = aws_s3_bucket.lambda_unified_events_consumer_code_bucket.id
}

resource "aws_s3_bucket_public_access_block" "lambda_unified_events_consumer_code_bucket" {
  bucket              = aws_s3_bucket.lambda_unified_events_consumer_code_bucket.id
  block_public_acls   = true
  block_public_policy = true
}
