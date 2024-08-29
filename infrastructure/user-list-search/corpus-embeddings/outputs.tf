
output "sagemaker_endpoint" {
  value = local.workspace.environment == "Prod" ? module.sagemaker_real_time[0].sagemaker_endpoint : module.sagemaker_serverless[0].sagemaker_endpoint
}

output "sagemaker_endpoint_name" {
  value = local.workspace.environment == "Prod" ? module.sagemaker_real_time[0].sagemaker_endpoint_name : module.sagemaker_serverless[0].sagemaker_endpoint_name
}

output "opensearch_domain_arn" {
  value = aws_opensearch_domain.corpus_search[0].arn
}

output "opensearch_domain_name" {
  value = aws_opensearch_domain.corpus_search[0].domain_name
}
