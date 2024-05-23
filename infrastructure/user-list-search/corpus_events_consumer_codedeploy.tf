resource "aws_codedeploy_app" "lambda_corpus_events" {
  compute_platform = "Lambda"
  name             = "${local.prefix}-CorpusIndexer"
}

resource "aws_codedeploy_deployment_group" "lambda_corpus_events" {
  app_name               = aws_codedeploy_app.lambda_corpus_events.name
  deployment_config_name = "CodeDeployDefault.LambdaAllAtOnce"
  deployment_group_name  = "${local.prefix}-CorpusIndexer"
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

resource "aws_codestarnotifications_notification_rule" "lambda_corpus_events_notifications" {
  detail_type = "BASIC"
  event_type_ids = [
    "codedeploy-application-deployment-failed",
  ]

  name     = aws_codedeploy_app.lambda_corpus_events.name
  resource = "arn:aws:codedeploy:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:application:${aws_codedeploy_app.lambda_corpus_events.name}"

  target {
    address = data.aws_sns_topic.backend-deploy-topic.arn
  }
}
