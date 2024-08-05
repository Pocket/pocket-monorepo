# ---------------------------------------------------------------------------------------------------------------------
# Example Deploy from HuggingFace Hub
# ---------------------------------------------------------------------------------------------------------------------

# Configure the AWS Provider
# provider "aws" {
#   region  = "us-east-1"
#   profile = "default"
# }


module "huggingface_sagemaker" {
  source = "../../"
  name_prefix              = "deploy-private-hub"
  pytorch_version          = "1.9.1"
  transformers_version     = "4.12.3"
  instance_type            = "ml.g4dn.xlarge"
  instance_count           = 1 # default is 1
  hf_model_id              = "distilbert-base-uncased-finetuned-sst-2-english"
  hf_task                  = "text-classification"
  hf_api_token             = "hf_Xxxx"
}
