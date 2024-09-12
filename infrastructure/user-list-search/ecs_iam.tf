data "aws_iam_policy_document" "ecs_task_assume" {
  version = "2012-10-17"

  statement {
    effect = "Allow"
    actions = [
      "sts:AssumeRole"
    ]

    principals {
      identifiers = [
        "ecs-tasks.amazonaws.com"
      ]
      type = "Service"
    }
  }
}

data "aws_iam_policy_document" "ecs_task_execution_role_policy" {
  version = "2012-10-17"

  statement {
    effect = "Allow"
    actions = [
      "ssm:GetParameter*"
    ]

    resources = [
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${local.name}/${local.env}",
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${local.name}/${local.env}/*",
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/Shared/${local.env}",
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/Shared/${local.env}/*"
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
      "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:Shared",
      "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:Shared/*",
      data.aws_kms_alias.secrets_manager.target_key_arn
    ]
  }
}

resource "aws_iam_role" "ecs_execution_role" {
  name               = "${local.prefix}-TaskExecutionRole"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_xray_write" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = data.aws_iam_policy.aws_xray_write_only_access.arn
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_default_attachment" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  role       = aws_iam_role.ecs_execution_role.id
}

resource "aws_iam_policy" "ecs_task_execution_role_policy" {
  name   = "${local.prefix}-TaskExecutionRolePolicy"
  policy = data.aws_iam_policy_document.ecs_task_execution_role_policy.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_custom_attachment" {
  policy_arn = aws_iam_policy.ecs_task_execution_role_policy.arn
  role       = aws_iam_role.ecs_execution_role.id
}


data "aws_iam_policy_document" "ecs_task_role_policy" {
  version = "2012-10-17"

  statement {
    effect = "Allow"
    actions = [
      "sqs:DeleteMessage",
      "sqs:DeleteMessageBatch",
      "sqs:ReceiveMessage",
      "sqs:SendMessage*",
    ]

    resources = [
      aws_sqs_queue.user_list_import.arn,
      aws_sqs_queue.user_items_update.arn,
      aws_sqs_queue.user_items_update_backfill.arn,
      aws_sqs_queue.user_list_import_backfill.arn
    ]
  }

  ## Allow invoking Sagemaker endpoint

  statement {
    effect = "Allow"
    actions = [
      "sagemaker:InvokeEndpointAsync",
      "sagemaker:InvokeEndpoint"
    ]
    resources = [module.corpus_embeddings.sagemaker_endpoint.arn]
  }

  ## Allow putting events on EventBridge
  statement {
    effect = "Allow"
    actions = [
      "events:PutEvent*",
    ]
    resources = [data.aws_cloudwatch_event_bus.shared.arn]
  }
}

resource "aws_iam_role" "ecs_task_role" {
  name               = "${local.prefix}-TaskRole"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_role_xray_write" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = data.aws_iam_policy.aws_xray_write_only_access.arn
}


resource "aws_iam_policy" "ecs_task_role_policy" {
  name   = "${local.prefix}-TaskRolePolicy"
  policy = data.aws_iam_policy_document.ecs_task_role_policy.json
}
resource "aws_iam_role_policy_attachment" "ecs_task_custom_attachment" {
  policy_arn = aws_iam_policy.ecs_task_role_policy.arn
  role       = aws_iam_role.ecs_task_role.id
}
