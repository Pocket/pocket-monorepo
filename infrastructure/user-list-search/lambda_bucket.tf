# NOTE: The bucket is called kinesis-consumer, because that was the old name of the lambdas deployed from here.
resource "aws_s3_bucket" "lambda_unified_events_consumer_code_bucket" {
  bucket = "pocket-${lower(local.prefix)}-kinesis-consumer"
  tags   = local.tags
}

resource "aws_s3_bucket_acl" "lambda_unified_events_consumer_code_bucket" {
  acl    = "private"
  bucket = aws_s3_bucket.lambda_unified_events_consumer_code_bucket.id
}

resource "aws_s3_bucket_public_access_block" "lambda_unified_events_consumer_code_bucket" {
  bucket              = aws_s3_bucket.lambda_unified_events_consumer_code_bucket.id
  block_public_acls   = true
  block_public_policy = true
}
