locals {
  userEventsSnsTopicArn = "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.snsTopicName.userEvents}"
}

resource "aws_sqs_queue" "user_events_sns_topic_dlq" {
  name = "${local.prefix}-SNS-Topic-DLQ"
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

resource "aws_sqs_queue_policy" "user_events_sqs_policy" {
  queue_url = aws_sqs_queue.user_list_events.id
  policy    = data.aws_iam_policy_document.user_events_sqs_policy_document.json
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

resource "aws_sqs_queue_policy" "user_events_sns_topic_dlq_policy" {
  queue_url = aws_sqs_queue.user_events_sns_topic_dlq.id
  policy    = data.aws_iam_policy_document.user_events_sns_topic_dlq_policy_document.json
}