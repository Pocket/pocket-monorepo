resource "aws_security_group" "es" {
  name        = "${local.prefix}-elasticsearch"
  description = "Managed by Terraform"
  vpc_id      = data.aws_vpc.vpc.id

  ingress {
    from_port = 443
    to_port   = 443
    protocol  = "tcp"

    cidr_blocks = [
      data.aws_vpc.vpc.cidr_block
    ]
  }
}

data "aws_iam_policy_document" "elasticsearch_log_publishing" {
  statement {
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:PutLogEventsBatch",
    ]

    resources = [
    "arn:aws:logs:*"]

    principals {
      identifiers = [
      "es.amazonaws.com"]
      type = "Service"
    }
  }
}

resource "aws_cloudwatch_log_resource_policy" "elasticsearch_log_publishing" {
  policy_document = data.aws_iam_policy_document.elasticsearch_log_publishing.json
  policy_name     = "${local.prefix}-AesLogPublish"
}

resource "aws_cloudwatch_log_group" "elasticsearch_slow_query" {
  name              = "/aws/aes/domains/${lower(local.prefix)}/slowquery"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "elasticsearch_slow_index" {
  name              = "/aws/aes/domains/${lower(local.prefix)}/slowindex"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "elasticsearch_error" {
  name              = "/aws/aes/domains/${lower(local.prefix)}/error"
  retention_in_days = 14
}
