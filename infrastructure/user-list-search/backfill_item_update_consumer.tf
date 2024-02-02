locals {
  iub_function_name = "${local.prefix}-ItemUpdateBackfill"
}

resource "aws_lambda_function" "item_update_backfill_sqs_processor" {
  function_name    = local.iub_function_name
  filename         = data.archive_file.lambda_zip.output_path #Dummy lambda that just logs the event.
  role             = aws_iam_role.item_update_backfill_lambda_role.arn
  runtime          = "nodejs18.x"
  handler          = "lambda.itemUpdateHandler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256 #Dummy lambda that just logs the event.
  # depends_on       = [aws_cloudwatch_log_group.item_update_sqs_processor]
  timeout = 300
  environment {
    variables = merge(local.app_env, {
      SQS_USER_ITEMS_UPDATE_URL = aws_sqs_queue.user_items_update_backfill.id
      SQS_USER_LIST_IMPORT_URL  = aws_sqs_queue.user_list_import_backfill.id
      PARSER_DB_SECRET_PATH     = "${local.aws_path_prefix}ParserDbCredentials"
    })
  }
  tags    = local.tags
  publish = true # We need to publish an initial version
  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash,
      reserved_concurrent_executions
    ]
  }

  memory_size = 1024

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

resource "aws_cloudwatch_log_group" "item_update_backfill_sqs_processor" {
  name              = "/aws/lambda/${local.iub_function_name}"
  retention_in_days = 14
}

resource "aws_lambda_alias" "item_update_backfill_sqs_processor" {
  function_name    = aws_lambda_function.item_update_backfill_sqs_processor.function_name
  function_version = split(":", aws_lambda_function.item_update_backfill_sqs_processor.qualified_arn)[7]
  name             = "DEPLOYED"
  lifecycle {
    ignore_changes = [
      //ignore so that code deploy can change this app
      function_version
    ]
  }
}

resource "aws_lambda_event_source_mapping" "item_update_backfill_sqs" {
  event_source_arn = aws_sqs_queue.user_items_update_backfill.arn
  function_name    = aws_lambda_alias.item_update_backfill_sqs_processor.arn #We set the function to our alias
}

resource "aws_iam_role" "item_update_backfill_lambda_role" {
  name               = "${local.prefix}-ItemUpdateBackfillLambdaExecutionRole"
  tags               = local.tags
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "item_update_backfill_lambda_role_xray_write" {
  role       = aws_iam_role.item_update_backfill_lambda_role.name
  policy_arn = data.aws_iam_policy.aws_xray_write_only_access.arn
}

resource "aws_iam_role_policy" "item_update_backfill_lambda_execution_policy" {
  name   = "${local.prefix}-ItemUpdateBackfillAccessPolicy"
  role   = aws_iam_role.item_update_backfill_lambda_role.id
  policy = data.aws_iam_policy_document.item_update_backfill_lambda_execution_policy.json
}

data "aws_iam_policy_document" "item_update_backfill_lambda_execution_policy" {
  version = "2012-10-17"

  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
      "sqs:SendMessageBatch",
      "sqs:ReceiveMessage*",
      "sqs:DeleteMessage*",
      "sqs:GetQueueAttributes"
    ]
    resources = [
      aws_sqs_queue.user_items_update_backfill.arn,
      aws_sqs_queue.user_list_import_backfill.arn,
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
