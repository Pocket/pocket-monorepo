module "sagemaker_serverless" {
  count                = local.workspace.environment == "Dev" ? 1 : 0
  source               = "./modules/sagemaker"
  name_prefix          = "${local.prefix}"
  pytorch_version      = local.sagemaker.pytorch_version
  transformers_version = local.sagemaker.transformers_version
  hf_model_id          = local.workspace.hf_model_id
  hf_task              = local.workspace.hf_task
  tags                 = local.tags

  # Development use serverless
  serverless_config = {
    max_concurrency   = 1
    memory_size_in_mb = 1024
  }
}

module "sagemaker_real_time" {
  count                = local.workspace.environment == "Prod" ? 1 : 0
  source               = "./modules/sagemaker"
  name_prefix          = "${local.prefix}"
  pytorch_version      = local.sagemaker.pytorch_version
  transformers_version = local.sagemaker.transformers_version
  hf_model_id          = local.workspace.hf_model_id
  hf_task              = local.workspace.hf_task
  tags                 = local.tags
  # Production use autoscaling and defined instance type
  instance_type = "ml.inf1.xlarge"
  autoscaling = {
    min_capacity               = 1
    max_capacity               = 2   # The max capacity of the scalable target
    scaling_target_invocations = 200 # The scaling target invocations (requests/minute)
  }
}
