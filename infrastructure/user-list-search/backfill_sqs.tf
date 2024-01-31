resource "aws_sqs_queue" "user_items_update_backfill" {
  name                      = "${local.prefix}-UserItemsUpdateBackfill"
  message_retention_seconds = local.message_retention_seconds
  tags                      = local.tags
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.user_items_update_backfill_deadletter.arn,
    maxReceiveCount     = 20
  })

  visibility_timeout_seconds = 21600 # 6 hours
}

resource "aws_sqs_queue" "user_items_update_backfill_deadletter" {
  name = "${local.prefix}-UserItemsUpdateBackfill-Deadletter"
}

resource "aws_sqs_queue" "user_list_import_backfill" {
  name                      = "${local.prefix}-UserListImportBackfill"
  message_retention_seconds = local.message_retention_seconds
  tags                      = local.tags
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.user_list_import_backfill_deadletter.arn,
    maxReceiveCount     = 20
  })

  visibility_timeout_seconds = 21600 # 6 hours
}

resource "aws_sqs_queue" "user_list_import_backfill_deadletter" {
  name = "${local.prefix}-UserListImportBackfill-Deadletter"
}
