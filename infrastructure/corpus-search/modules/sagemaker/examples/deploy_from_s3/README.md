# Example: Deploy from Amazon S3

```hcl
module "huggingface_sagemaker" {
  source               = "philschmid/sagemaker-huggingface/aws"
  version              = "0.5.0"
  name_prefix          = "deploy-s3"
  pytorch_version      = "1.9.1"
  transformers_version = "4.12.3"
  instance_type        = "ml.g4dn.xlarge"
  instance_count       = 1 # default is 1
  model_data           = "s3://my-bucket/mypath/model.tar.gz"
  hf_task              = "text-classification"
}
```