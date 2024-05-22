locals {
  cevh_function_name = "${local.prefix}-CorpusIndexer"
}

resource "aws_lambda_function" "corpus_events_sqs_processor" {
  function_name                      = local.cevh_function_name
  filename                           = data.archive_file.lambda_zip.output_path #Dummy lambda that just logs the event (use aws cli to package and deploy in circleci)
  role                               = aws_iam_role.corpus_events_lambda_role.arn
  runtime                            = "nodejs20.x"
  handler                            = "index.handler"
  source_code_hash                   = data.archive_file.lambda_zip.output_base64sha256 #Dummy lambda that just logs the event.
  batch_size                         = 10
  maximum_batching_window_in_seconds = 300
  timeout                            = 500
  environment {
    variables = local.lambda_env
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

resource "aws_cloudwatch_log_group" "corpus_events_sqs_processor" {
  name              = "/aws/lambda/${local.cevh_function_name}"
  retention_in_days = 14
}

resource "aws_lambda_alias" "corpus_events_sqs_processor" {
  function_name    = aws_lambda_function.corpus_events_sqs_processor.function_name
  function_version = split(":", aws_lambda_function.corpus_events_sqs_processor.qualified_arn)[7]
  name             = "DEPLOYED"
  lifecycle {
    ignore_changes = [
      //ignore so that code deploy can change this app
      function_version
    ]
  }
}

resource "aws_lambda_event_source_mapping" "corpus_events_sqs" {
  event_source_arn = aws_sqs_queue.corpus_events.arn
  batch_size       = 10
  function_name    = aws_lambda_alias.corpus_events_sqs_processor.arn #We set the function to our alias
}

resource "aws_iam_role" "corpus_events_lambda_role" {
  name               = "${local.prefix}-CorpusEventsLambdaExecutionRole"
  tags               = local.tags
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "corpus_events_lambda_role_xray_write" {
  role       = aws_iam_role.corpus_events_lambda_role.name
  policy_arn = data.aws_iam_policy.aws_xray_write_only_access.arn
}

resource "aws_iam_role_policy" "corpus_events_lambda_execution_policy" {
  name   = "${local.prefix}-CorpusEventsAccessPolicy"
  role   = aws_iam_role.corpus_events_lambda_role.id
  policy = data.aws_iam_policy_document.corpus_events_lambda_execution_policy.json
}

data "aws_iam_policy_document" "corpus_events_lambda_execution_policy" {
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
      aws_sqs_queue.corpus_events.arn
    ]
  }

  statement {
    effect  = "Allow"
    actions = ["es:ESHttp*"]
    # Access to the bulk APIs for the corpus indices
    resources = [
      "${aws_elasticsearch_domain.user_search.arn}/_bulk",
      "${aws_elasticsearch_domain.user_search.arn}/corpus_en/_bulk",
      "${aws_elasticsearch_domain.user_search.arn}/corpus_de/_bulk",
      "${aws_elasticsearch_domain.user_search.arn}/corpus_es/_bulk",
      "${aws_elasticsearch_domain.user_search.arn}/corpus_it/_bulk",
      "${aws_elasticsearch_domain.user_search.arn}/corpus_fr/_bulk",
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
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]
    resources = [
      "arn:aws:logs:*:*:*"
    ]
  }
}
