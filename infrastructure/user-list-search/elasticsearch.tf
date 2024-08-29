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

resource "aws_elasticsearch_domain" "user_search" {
  count = local.workspace.es_cluster_enable ? 1 : 0

  domain_name           = "${lower(local.prefix)}-v2"
  elasticsearch_version = "OpenSearch_2.13"

  access_policies = <<CONFIG
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "es:*",
            "Principal": "*",
            "Effect": "Allow",
            "Resource": "arn:aws:es:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:domain/${lower(local.prefix)}-v2/*"
        }
    ]
}
CONFIG

  auto_tune_options {
    desired_state = "ENABLED"
  }

  cluster_config {
    instance_count           = local.workspace.es_instance_count
    instance_type            = local.workspace.es_instance_type
    dedicated_master_count   = 3
    dedicated_master_enabled = true
    dedicated_master_type    = local.workspace.es_master_instance_type
    zone_awareness_enabled   = true
    zone_awareness_config {
      availability_zone_count = 3
    }
  }

  ebs_options {
    ebs_enabled = true
    volume_type = "gp3"
    # General Purpose (SSD)
    volume_size = local.workspace.es_ebs_volume_size
  }

  # Do not destroy this OS instance unless YOU MEAN IT!
  lifecycle {
    ignore_changes = [
      # let gp3 defaults work here, changes ignored in terraform
      ebs_options[0].iops
    ]
    prevent_destroy = true
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.elasticsearch_slow_index.arn
    enabled                  = true
    log_type                 = "INDEX_SLOW_LOGS"
  }
  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.elasticsearch_slow_query.arn
    enabled                  = true
    log_type                 = "SEARCH_SLOW_LOGS"
  }
  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.elasticsearch_error.arn
    enabled                  = true
    log_type                 = "ES_APPLICATION_LOGS"
  }

  vpc_options {
    subnet_ids = [
      local.private_subnet_ids[0],
      local.private_subnet_ids[1],
      local.private_subnet_ids[2]
    ]
    security_group_ids = [
    aws_security_group.es.id]
  }

  tags = local.tags
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

# Manual snapshot requirements
# S3 bucket to store snapshots
resource "aws_s3_bucket" "search_snapshots_bucket" {
  bucket = "pocket-${lower(local.prefix)}-search-snapshots"
  tags   = local.tags
}

resource "aws_s3_bucket_acl" "search_snapshots_bucket" {
  acl        = "private"
  bucket     = aws_s3_bucket.search_snapshots_bucket.id
  depends_on = [aws_s3_bucket_ownership_controls.search_snapshots_bucket]
}

resource "aws_s3_bucket_public_access_block" "search_snapshots_bucket" {
  bucket              = aws_s3_bucket.search_snapshots_bucket.id
  block_public_acls   = true
  block_public_policy = true
}

resource "aws_s3_bucket_ownership_controls" "search_snapshots_bucket" {
  bucket = aws_s3_bucket.search_snapshots_bucket.id
  rule {
    object_ownership = "ObjectWriter"
  }
}

#  IAM role with access to S3 bucket
resource "aws_iam_role" "search_snapshot_role" {
  name               = "${local.prefix}-OSManualSnapshotRole"
  tags               = local.tags
  assume_role_policy = <<EOF
  {
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "",
    "Effect": "Allow",
    "Principal": {
      "Service": "es.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
  }]
}
EOF
}

data "aws_iam_policy_document" "snapshot_access_policy" {
  version = "2012-10-17"

  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ]
    resources = [
      "${aws_s3_bucket.search_snapshots_bucket.arn}/*",
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "s3:ListBucket"
    ]
    resources = [
      aws_s3_bucket.search_snapshots_bucket.arn
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "iam:PassRole"
    ]
    resources = [
      aws_iam_role.search_snapshot_role.arn
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "es:ESHttpPut",
    ]
    resources = [
      "${aws_elasticsearch_domain.user_search[0].arn}/*",
      "${module.corpus_embeddings.opensearch_domain_arn}/*"
    ]
  }
}

resource "aws_iam_role_policy" "snapshot_access_policy_attachment" {
  name   = "${local.prefix}-OSManualSnapshotS3AccessPolicy"
  role   = aws_iam_role.search_snapshot_role.id
  policy = data.aws_iam_policy_document.snapshot_access_policy.json
}
