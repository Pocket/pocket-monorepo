data "aws_sqs_queue" "job_queue" {
  name = var.sqs_queue_name
}
