
module "sagemaker" {
  source               = "./modules/sagemaker"
  name_prefix          = "distilbert"
  pytorch_version      = "1.9.1"
  transformers_version = "4.12.3"
  instance_type        = "ml.g4dn.xlarge"
  hf_model_id          = "sentence-transformers/msmarco-distilbert-base-tas-b"
  hf_task              = "feature-extraction"
  autoscaling = {
    min_capacity               = 1
    max_capacity               = local.env == "Dev" ? 1 : 2 # The max capacity of the scalable target
    scaling_target_invocations = 200                        # The scaling target invocations (requests/minute)
  }
  tags                = local.tags
}

# # ----
# # | Model upload
# # ---

# resource "aws_s3_bucket" "search_model_bucket" {
#   bucket = "pocket-${lower(local.prefix)}-models"
#   tags   = local.tags
# }

# resource "aws_s3_bucket_acl" "search_model_bucket" {
#   acl        = "private"
#   bucket     = aws_s3_bucket.search_model_bucket.id
# }
