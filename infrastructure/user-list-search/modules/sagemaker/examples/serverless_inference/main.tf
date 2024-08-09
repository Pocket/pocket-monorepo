# ---------------------------------------------------------------------------------------------------------------------
# Example Serverless Endpoint
# ---------------------------------------------------------------------------------------------------------------------

module "huggingface_sagemaker" {
  source               = "../../"
  name_prefix          = "deploy-hub"
  pytorch_version      = "1.9.1"
  transformers_version = "4.12.3"
  hf_model_id          = "distilbert-base-uncased-finetuned-sst-2-english"
  hf_task              = "text-classification"
  serverless_config = {
    max_concurrency   = 1
    memory_size_in_mb = 1024
  }
}
