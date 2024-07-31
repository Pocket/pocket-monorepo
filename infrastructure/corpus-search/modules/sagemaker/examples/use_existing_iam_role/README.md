# Example: Use existing IAM Role

```hcl
module "huggingface_sagemaker" {
  source               = "philschmid/sagemaker-huggingface/aws"
  version              = "0.5.0"
  name_prefix          = "deploy-hub"
  pytorch_version      = "1.9.1"
  transformers_version = "4.12.3"
  instance_type        = "ml.g4dn.xlarge"
  hf_model_id          = "distilbert-base-uncased-finetuned-sst-2-english"
  hf_task              = "text-classification"
  sagemaker_execution_role = "sagemaker_execution_role"
```