# Example Autoscaling

```hcl
module "huggingface_sagemaker" {
  source               = "philschmid/sagemaker-huggingface/aws"
  version              = "0.5.0"
  name_prefix          = "autoscaling"
  pytorch_version      = "1.9.1"
  transformers_version = "4.12.3"
  instance_type        = "ml.g4dn.xlarge"
  instance_count       = 1 # default is 1
  hf_model_id          = "distilbert-base-uncased-finetuned-sst-2-english"
  hf_task              = "text-classification"
  autoscaling = {
    min_capacity               = 1   # The min capacity of the scalable target, default is 1
    max_capacity               = 4   # The max capacity of the scalable target
    scaling_target_invocations = 200 # The scaling target invocations (requests/minute)
    scale_in_cooldown          = 300 # The cooldown time after scale-in, default is 300
    scale_out_cooldown         = 60  # The cooldown time after scale-out, default is 60
  }
}
```