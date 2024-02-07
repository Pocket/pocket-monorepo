variable "service_hash" {
  type        = string
  default     = null
  description = "Overrides the GitSHA1 that is pulled from SSM and uses this instead. This is only for rolling back or forcing a deployment."
}

variable "ecr_repository_name" {
  description = "The AWS ECR repository where the image is stored"
  type        = string
}

variable "service_name" {
  description = "The service name"
  type        = string
  default     = "Push"
}

variable "environment" {
  description = "Environment of the server"
  type        = string
}

variable "iam_stack" {
  description = "The name of the iam stack"
  type        = string
}

variable "sqs_queue_name" {
  description = "Queue process reads from for jobs"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}
