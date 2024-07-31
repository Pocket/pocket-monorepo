# Example Asynchronous Endpoint

```hcl
# create bucket for async inference for inputs & outputs
resource "aws_s3_bucket" "async_inference_bucket" {
  bucket = "async-inference-bucket"
}


module "huggingface_sagemaker" {
  source               = "philschmid/sagemaker-huggingface/aws"
  version              = "0.5.0"
  name_prefix          = "deploy-hub"
  pytorch_version      = "1.9.1"
  transformers_version = "4.12.3"
  instance_type        = "ml.g4dn.xlarge"
  hf_model_id          = "distilbert-base-uncased-finetuned-sst-2-english"
  hf_task              = "text-classification"
  async_config = {
    # needs to be a s3 uri
    s3_output_path = "s3://async-inference-bucket/async-distilbert"
    # (Optional) specify Amazon SNS topics, S3 failure path and custom KMS Key
    # s3_failure_path   = "s3://async-inference-bucket/failed-inference"    
    # kms_key_id        = "string"
    # sns_error_topic   = "arn:aws:sns:aws-region:account-id:topic-name"
    # sns_success_topic = "arn:aws:sns:aws-region:account-id:topic-name"
  }
  autoscaling = {
    min_capacity               = 0
    max_capacity               = 4
    scaling_target_invocations = 100
  }
}
```
