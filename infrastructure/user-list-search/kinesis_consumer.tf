locals {
  ue_function_name = "${local.prefix}-UnifiedEventsConsumer"
}

resource "aws_lambda_function" "unified_events_consumer" {
  function_name    = local.ue_function_name
  filename         = data.archive_file.lambda_zip.output_path #Dummy lambda that just logs the event.
  role             = aws_iam_role.lambda_role.arn
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256 #Dummy lambda that just logs the event.
  # depends_on       = [aws_cloudwatch_log_group.unified_events_consumer]
  timeout = 300
  environment {
    variables = local.app_env
  }
  tags        = local.tags
  publish     = true # We need to publish an initial version
  memory_size = 256
  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash
    ]
  }

  tracing_config {
    mode = "Active"
  }
}

resource "aws_cloudwatch_log_group" "unified_events_consumer" {
  name              = "/aws/lambda/${local.ue_function_name}"
  retention_in_days = 14
}

resource "aws_lambda_alias" "unified_events_consumer" {
  function_name    = aws_lambda_function.unified_events_consumer.function_name
  function_version = split(":", aws_lambda_function.unified_events_consumer.qualified_arn)[7]
  name             = "DEPLOYED"
  lifecycle {
    ignore_changes = [
      //ignore so that code deploy can change this app
      function_version
    ]
  }
}

resource "aws_lambda_event_source_mapping" "kinesis_consumer" {
  event_source_arn              = data.aws_kinesis_stream.unified.arn
  function_name                 = aws_lambda_alias.unified_events_consumer.arn #We set the function to our alias
  starting_position             = "LATEST"
  batch_size                    = 10000
  maximum_record_age_in_seconds = 60
  enabled                       = true
  lifecycle {
    ignore_changes = [enabled]
  }
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
  name   = "${local.prefix}-KinesisEventAccessPolicy"
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

data "aws_iam_policy_document" "lambda_execution_policy" {
  version = "2012-10-17"

  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
      "sqs:SendMessageBatch",
    ]
    resources = [
      aws_sqs_queue.user_items_update.arn,
      aws_sqs_queue.user_list_import.arn,
      aws_sqs_queue.user_items_delete.arn
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
      "kinesis:ListStreams",
      "kinesis:ListShards",
      "kinesis:DescribeLimits",
      "kinesis:ListStreamConsumers"
    ]
    resources = [
      "*"
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "kinesis:SubscribeToShard",
      "kinesis:Describe*",
      "kinesis:Get*",
      "kinesis:ListTagsForStream"
    ]
    resources = [
      data.aws_kinesis_stream.unified.arn
    ]
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
}
