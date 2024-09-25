locals {
  userEventsSnsTopicArn       = "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.snsTopicName.userEvents}"
  corpusEventsSnsTopicArn     = "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.snsTopicName.corpusEvents}"
  collectionEventsSnsTopicArn = "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.snsTopicName.collectionEvents}"
}

resource "aws_sqs_queue" "user_events_sns_topic_dlq" {
  name = "${local.prefix}-SNS-Topic-DLQ"
  tags = local.tags
}

# Use a single queue for all corpus index events
# These can originate from the CorpusEvents or CollectionEvents topics
resource "aws_sqs_queue" "corpus_events_sns_topic_dlq" {
  name = "${local.prefix}-CorpusIndexEvents-SNS-Topic-DLQ"
  tags = local.tags
}

resource "aws_sns_topic_subscription" "user_events_sns_topic_subscription" {
  topic_arn = local.userEventsSnsTopicArn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.user_list_events.arn
  # The version of terraform used in this service does not support redrive_policy
  # an update is required. It is not blocking but should be prioritized soon
  #  redrive_policy = jsonencode({
  #    deadLetterTargetArn: aws_sqs_queue.user_events_sns_topic_dlq.arn
  #  })
  depends_on = [aws_sqs_queue.user_events_sns_topic_dlq, aws_sqs_queue.user_list_events]
}

resource "aws_sns_topic_subscription" "corpus_events_sns_topic_subscription" {
  topic_arn = local.corpusEventsSnsTopicArn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.corpus_events.arn
  # Need to do some more work to get this policy to work. It fails with
  # permissions error.
  # redrive_policy = jsonencode({
  #   deadLetterTargetArn : aws_sqs_queue.corpus_events_sns_topic_dlq.arn
  # })
  depends_on = [aws_sqs_queue.corpus_events_sns_topic_dlq, aws_sqs_queue.corpus_events]
}

resource "aws_sns_topic_subscription" "collection_events_sns_topic_subscription" {
  topic_arn = local.collectionEventsSnsTopicArn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.corpus_events.arn
  # The version of terraform used in this service does not support redrive_policy
  # an update is required. It is not blocking but should be prioritized soon
  #  redrive_policy = jsonencode({
  #    deadLetterTargetArn: aws_sqs_queue.corpus_events_sns_topic_dlq.arn
  #  })
  depends_on = [aws_sqs_queue.corpus_events_sns_topic_dlq, aws_sqs_queue.corpus_events]
}

resource "aws_sns_topic_subscription" "corpus_events_hydration_sns_topic_subscription" {
  topic_arn           = local.corpusEventsSnsTopicArn
  protocol            = "sqs"
  endpoint            = aws_sqs_queue.corpus_events_hydration.arn
  # Don't need removed events in the hydration queue -- just index-related ones
  filter_policy_scope = "MessageBody"
  filter_policy = jsonencode({
    detail-type = [
      {
        anything-but = "remove-approved-item"
      }
    ]
  })
  # Need to do some more work to get this policy to work. It fails with
  # permissions error.
  # redrive_policy = jsonencode({
  #   deadLetterTargetArn : aws_sqs_queue.corpus_events_sns_topic_dlq.arn
  # })
  # Reuse the DLQ for the overall SNS topic
  depends_on = [aws_sqs_queue.corpus_events_sns_topic_dlq, aws_sqs_queue.corpus_events_hydration]
}

resource "aws_sns_topic_subscription" "collection_events_hydration_sns_topic_subscription" {
  topic_arn = local.collectionEventsSnsTopicArn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.corpus_events_hydration.arn
  # The version of terraform used in this service does not support redrive_policy
  # an update is required. It is not blocking but should be prioritized soon
  #  redrive_policy = jsonencode({
  #    deadLetterTargetArn: aws_sqs_queue.corpus_events_sns_topic_dlq.arn
  #  })
  depends_on = [aws_sqs_queue.corpus_events_sns_topic_dlq, aws_sqs_queue.corpus_events_hydration]
}

data "aws_iam_policy_document" "user_events_sqs_policy_document" {
  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage"
    ]
    resources = [aws_sqs_queue.user_list_events.arn]
    principals {
      identifiers = [
        "sns.amazonaws.com"
      ]
      type = "Service"
    }
    condition {
      test     = "ArnEquals"
      values   = [local.userEventsSnsTopicArn]
      variable = "aws:SourceArn"
    }
  }
  depends_on = [aws_sqs_queue.user_list_events]
}


data "aws_iam_policy_document" "corpus_events_sqs_policy_document" {
  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage"
    ]
    resources = [aws_sqs_queue.corpus_events.arn]
    principals {
      identifiers = [
        "sns.amazonaws.com"
      ]
      type = "Service"
    }
    # This is actually an 'or' combination when it's the same test key
    # https://github.com/hashicorp/terraform-provider-aws/issues/25071#issuecomment-1147934044
    condition {
      test     = "ArnEquals"
      values   = [local.corpusEventsSnsTopicArn]
      variable = "aws:SourceArn"
    }
    condition {
      test     = "ArnEquals"
      values   = [local.collectionEventsSnsTopicArn]
      variable = "aws:SourceArn"
    }
  }
  depends_on = [aws_sqs_queue.corpus_events]
}


data "aws_iam_policy_document" "corpus_events_hydration_sqs_policy_document" {
  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage"
    ]
    resources = [aws_sqs_queue.corpus_events_hydration.arn]
    principals {
      identifiers = [
        "sns.amazonaws.com"
      ]
      type = "Service"
    }
    # This is actually an 'or' combination when it's the same test key
    # https://github.com/hashicorp/terraform-provider-aws/issues/25071#issuecomment-1147934044
    condition {
      test     = "ArnEquals"
      values   = [local.corpusEventsSnsTopicArn]
      variable = "aws:SourceArn"
    }
    condition {
      test     = "ArnEquals"
      values   = [local.collectionEventsSnsTopicArn]
      variable = "aws:SourceArn"
    }
  }
  depends_on = [aws_sqs_queue.corpus_events_hydration]
}

resource "aws_sqs_queue_policy" "user_events_sqs_policy" {
  queue_url = aws_sqs_queue.user_list_events.id
  policy    = data.aws_iam_policy_document.user_events_sqs_policy_document.json
}

resource "aws_sqs_queue_policy" "corpus_events_sqs_policy" {
  queue_url = aws_sqs_queue.corpus_events.id
  policy    = data.aws_iam_policy_document.corpus_events_sqs_policy_document.json
}

resource "aws_sqs_queue_policy" "corpus_events_hydration_sqs_policy" {
  queue_url = aws_sqs_queue.corpus_events_hydration.id
  policy    = data.aws_iam_policy_document.corpus_events_hydration_sqs_policy_document.json
}

data "aws_iam_policy_document" "user_events_sns_topic_dlq_policy_document" {
  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage"
    ]
    resources = [aws_sqs_queue.user_events_sns_topic_dlq.arn]
    principals {
      identifiers = [
        "sns.amazonaws.com"
      ]
      type = "Service"
    }
    condition {
      test     = "ArnEquals"
      values   = [local.userEventsSnsTopicArn]
      variable = "aws:SourceArn"
    }
  }
  depends_on = [aws_sqs_queue.user_events_sns_topic_dlq]
}

data "aws_iam_policy_document" "corpus_events_sns_topic_dlq_policy_document" {
  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage"
    ]
    resources = [aws_sqs_queue.corpus_events_sns_topic_dlq.arn]
    principals {
      identifiers = [
        "sns.amazonaws.com"
      ]
      type = "Service"
    }
    condition {
      test     = "ArnEquals"
      values   = [local.corpusEventsSnsTopicArn, local.collectionEventsSnsTopicArn]
      variable = "aws:SourceArn"
    }
  }
  depends_on = [aws_sqs_queue.corpus_events_sns_topic_dlq]
}

resource "aws_sqs_queue_policy" "user_events_sns_topic_dlq_policy" {
  queue_url = aws_sqs_queue.user_events_sns_topic_dlq.id
  policy    = data.aws_iam_policy_document.user_events_sns_topic_dlq_policy_document.json
}

resource "aws_sqs_queue_policy" "corpus_events_sns_topic_dlq_policy" {
  queue_url = aws_sqs_queue.corpus_events_sns_topic_dlq.id
  policy    = data.aws_iam_policy_document.corpus_events_sns_topic_dlq_policy_document.json
}
