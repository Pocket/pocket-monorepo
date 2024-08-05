# Example: Deploy private model from Hugging Face Hub (hf.co/models)

```hcl
module "huggingface_sagemaker" {
  source                   = "philschmid/sagemaker-huggingface/aws"
  version                  = "0.5.0"
  name_prefix              = "deploy-private-hub"
  pytorch_version          = "1.9.1"
  transformers_version     = "4.12.3"
  instance_type            = "ml.g4dn.xlarge"
  instance_count           = 1 # default is 1
  hf_model_id              = "distilbert-base-uncased-finetuned-sst-2-english"
  hf_task                  = "text-classification"
  hf_api_token             = "hf_Xxxx"
}
```