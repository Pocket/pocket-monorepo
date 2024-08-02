# -----
# CodeDeploy
# -----

data "aws_iam_policy" "aws_xray_write_only_access" {
  arn = "arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess"
}

data "aws_iam_policy_document" "codedeploy_assume_role" {
  statement {
    effect = "Allow"
    actions = [
      "sts:AssumeRole"
    ]
    principals {
      identifiers = [
        "codedeploy.amazonaws.com"
      ]
      type = "Service"
    }
  }
}

resource "aws_codedeploy_app" "lambda_create_ml_connector" {
  compute_platform = "Lambda"
  name             = "${local.prefix}-CreateMlConnector"
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

resource "aws_iam_role" "lambda_role" {
  name               = "${local.prefix}-LambdaExecutionRole"
  tags               = local.tags
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "lambda_role_xray_write" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = data.aws_iam_policy.aws_xray_write_only_access.arn
}

resource "aws_iam_role_policy" "lambda_execution_policy" {
  name   = "${local.prefix}-LambdaAccessPolicy"
  role   = aws_iam_role.lambda_role.id
  policy = data.aws_iam_policy_document.lambda_execution_policy.json
}

data "aws_iam_policy_document" "lambda_assume" {
  version = "2012-10-17"

  statement {
    effect = "Allow"
    actions = [
      "sts:AssumeRole"
    ]

    principals {
      identifiers = [
        "lambda.amazonaws.com"
      ]

      type = "Service"
    }
  }
}


resource "aws_codedeploy_deployment_group" "lambda_create_ml_connector" {
  app_name               = aws_codedeploy_app.lambda_create_ml_connector.name
  deployment_config_name = "CodeDeployDefault.LambdaAllAtOnce"
  deployment_group_name  = "${local.prefix}-CreateMlConnector"
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
resource "aws_codestarnotifications_notification_rule" "lambda_create_ml_connector_notifications" {
  detail_type = "BASIC"
  event_type_ids = [
    "codedeploy-application-deployment-failed",
  ]

  name     = aws_codedeploy_app.lambda_create_ml_connector.name
  resource = "arn:aws:codedeploy:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:application:${aws_codedeploy_app.lambda_create_ml_connector.name}"

  target {
    address = data.aws_sns_topic.backend-deploy-topic.arn
  }
}

# --
# Lambda
# --

locals {
  ulib_function_name = "${local.prefix}-CreateMlConnector"
}

resource "aws_lambda_function" "create_ml_connector" {
  function_name    = local.ulib_function_name
  filename         = data.archive_file.lambda_zip.output_path #Dummy lambda that just logs the event.
  role             = aws_iam_role.create_ml_connector_lambda_role.arn
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256 #Dummy lambda that just logs the event.

  timeout = 900
  environment {
    variables = merge(local.lambda_env, {
      BACKFILL = "true"
    })
  }
  tags    = local.tags
  publish = true # We need to publish an initial version
  lifecycle {
    ignore_changes = [
      environment["GIT_SHA"],
      filename,
      source_code_hash,
      reserved_concurrent_executions
    ]
  }

  memory_size = 512

  vpc_config {
    subnet_ids = split(",", data.aws_ssm_parameter.private_subnets.value)
    security_group_ids = [
      aws_security_group.ecs_security_group.id
    ]
  }

  tracing_config {
    mode = "Active"
  }

  reserved_concurrent_executions = 1
}

resource "aws_cloudwatch_log_group" "create_ml_connector" {
  name              = "/aws/lambda/${local.ulib_function_name}"
  retention_in_days = 14
}

resource "aws_lambda_alias" "create_ml_connector_sqs_processor" {
  function_name    = aws_lambda_function.create_ml_connector.function_name
  function_version = split(":", aws_lambda_function.create_ml_connector.qualified_arn)[7]
  name             = "DEPLOYED"
  lifecycle {
    ignore_changes = [
      //ignore so that code deploy can change this app
      function_version
    ]
  }
}

resource "aws_iam_role" "create_ml_connector_lambda_role" {
  name               = "${local.prefix}-CreateMlConnectorLambdaExecutionRole"
  tags               = local.tags
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "create_ml_connector_lambda_role_xray_write" {
  role       = aws_iam_role.create_ml_connector_lambda_role.name
  policy_arn = data.aws_iam_policy.aws_xray_write_only_access.arn
}

resource "aws_iam_role_policy" "create_ml_connector_lambda_execution_policy" {
  name   = "${local.prefix}-CreateMlConnectorAccessPolicy"
  role   = aws_iam_role.create_ml_connector_lambda_role.id
  policy = data.aws_iam_policy_document.create_ml_connector_lambda_execution_policy.json
}

data "aws_iam_policy_document" "create_ml_connector_lambda_execution_policy" {
  version = "2012-10-17"

  statement {
    effect    = "Allow"
    actions   = ["es:ESHttpPost"]
    resources = ["${aws_opensearch_domain.corpus_search[0].arn}/*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "ssm:GetParameter*"
    ]

    resources = [
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${local.name}/${local.env}",
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${local.name}/${local.env}/*"
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "kms:Decrypt"
    ]

    resources = [
      "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:${local.name}/${local.env}",
      "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:${local.name}/${local.env}/*",
      "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:${local.name}/Default",
      "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:${local.name}/Default/*",
      data.aws_kms_alias.secrets_manager.target_key_arn
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]
    resources = [
      "arn:aws:logs:*:*:*"
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "ec2:DescribeNetworkInterfaces",
      "ec2:CreateNetworkInterface",
      "ec2:DeleteNetworkInterface",
      "ec2:DescribeInstances",
      "ec2:AttachNetworkInterface"
    ]
    resources = [
      "*"
    ]
  }
}
