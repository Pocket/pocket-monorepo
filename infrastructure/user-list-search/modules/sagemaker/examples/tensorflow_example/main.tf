# ---------------------------------------------------------------------------------------------------------------------
# Example Deploy Tensorflow model
# ---------------------------------------------------------------------------------------------------------------------

module "huggingface_sagemaker" {
  source = "../../"
  name_prefix              = "test"
  tensorflow_version       = "2.5.1"
  transformers_version     = "4.12.3"
  instance_type            = "ml.g4dn.xlarge"
  instance_count           = 1 # default is 1
  hf_model_id              = "distilbert-base-uncased-finetuned-sst-2-english"
  hf_task                  = "text-classification"
}