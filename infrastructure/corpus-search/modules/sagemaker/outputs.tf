# ------------------------------------------------------------------------------
# Output
# ------------------------------------------------------------------------------
output "used_container" {
  description = "Used container for creating the endpoint"
  value       = data.aws_sagemaker_prebuilt_ecr_image.deploy_image.registry_path
}

output "iam_role" {
  description = "IAM role used in the endpoint"
  value       = local.role_arn
}

output "sagemaker_model" {
  description = "created Amazon SageMaker model resource"
  value       = local.sagemaker_model
}

output "sagemaker_endpoint_configuration" {
  description = "created Amazon SageMaker endpoint configuration resource"
  value       = aws_sagemaker_endpoint_configuration.model
}

output "sagemaker_endpoint" {
  description = "created Amazon SageMaker endpoint resource"
  value       = aws_sagemaker_endpoint.model
}

output "sagemaker_endpoint_name" {
  description = "Name of the created Amazon SageMaker endpoint, used for invoking the endpoint, with sdks"
  value       = aws_sagemaker_endpoint.model.name
}


output "tags" {
  value = var.tags
}
