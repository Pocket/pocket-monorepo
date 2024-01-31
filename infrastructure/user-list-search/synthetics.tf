resource "aws_iam_role" "syntethics" {
  name               = "${local.prefix}-CloudWatchSyntheticsRole"
  tags               = local.tags
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "syntethics" {
  statement {
    effect = "Allow"
    actions = [
      "s3:ListAllMyBuckets",
      "logs:CreateLogGroup"
    ]

    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetBucketLocation",
      "s3:ListBucket"
    ]

    resources = [
      "${aws_s3_bucket.synthetics_logs.arn}/*",
      aws_s3_bucket.synthetics_logs.arn
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = [
      "arn:aws:logs:*:log-group:/aws/lambda/cwsyn-${lower(local.name)}-${lower(local.env)}-*"
    ]
  }


  statement {
    effect  = "Allow"
    actions = ["cloudwatch:PutMetricData"]

    resources = ["*"]

    condition {
      test     = "StringEquals"
      values   = ["CloudWatchSynthetics"]
      variable = "cloudwatch:namespace"
    }
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

resource "aws_iam_role_policy" "syntethics" {
  name   = "${local.prefix}-CloudWatchSyntheticsPolicy"
  role   = aws_iam_role.syntethics.id
  policy = data.aws_iam_policy_document.syntethics.json
}

resource "aws_s3_bucket" "synthetics_logs" {
  bucket        = lower("${local.prefix}-SyntheticLogs")
  tags          = local.tags
  force_destroy = true
}
