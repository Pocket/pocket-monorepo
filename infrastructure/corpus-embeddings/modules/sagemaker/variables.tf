# ------------------------------------------------------------------------------
# Variables
# ------------------------------------------------------------------------------
variable "name_prefix" {
  description = "A prefix used for naming resources."
  type        = string
}

variable "transformers_version" {
  description = "Transformers version you want to use for executing your model training code. Defaults to None. [List of supported versions](https://huggingface.co/docs/sagemaker/reference#inference-dlc-overview)"
  type        = string
}

variable "pytorch_version" {
  description = "PyTorch version you want to use for executing your inference code. Defaults to `None`. Required unless `tensorflow_version` is provided. [List of supported versions](https://huggingface.co/docs/sagemaker/reference#inference-dlc-overview)"
  type        = string
  default     = null
}

variable "tensorflow_version" {
  description = "TensorFlow version you want to use for executing your inference code. Defaults to `None`. Required unless `pytorch_version` is provided. [List of supported versions](https://huggingface.co/docs/sagemaker/reference#inference-dlc-overview)"
  type        = string
  default     = null
}

variable "image_tag" {
  description = "The image tag you want to use for the container you want to use. Defaults to `None`. The module tries to derive the `image_tag` from the `pytorch_version`, `tensorflow_version` & `instance_type`. If you want to override this, you can provide the `image_tag` as a variable."
  type        = string
  default     = null
}

variable "instance_type" {
  description = "The EC2 instance type to deploy this Model to. For example, `ml.p2.xlarge`."
  type        = string
  default     = null
}

variable "instance_count" {
  description = "The initial number of instances to run in the Endpoint created from this Model. Defaults to 1."
  type        = number
  default     = 1
}

variable "model_data" {
  description = "The The S3 path where the model artifacts are stored. This path must point to a single gzip compressed tar archive (.tar.gz suffix)."
  type        = string
  default     = null
}

variable "hf_model_id" {
  description = "The HF_MODEL_ID environment variable defines the model id, which will be automatically loaded from [hf.co/models](https://huggingface.co/models) when creating or SageMaker Endpoint."
  type        = string
  default     = null
}

variable "hf_task" {
  description = "The HF_TASK environment variable defines the task for the used 🤗 Transformers pipeline. A full list of tasks can be find [here](https://huggingface.co/transformers/main_classes/pipelines.html)."
  type        = string
  default     = null
}

variable "hf_api_token" {
  description = "The HF_API_TOKEN environment variable defines the your Hugging Face authorization token. The HF_API_TOKEN is used as a HTTP bearer authorization for remote files, like private models. You can find your token at your settings page."
  type        = string
  default     = null
}

variable "hf_model_revision" {
  description = "The HF_MODEL_REVISION is an extension to HF_MODEL_ID and allows you to define/pin a revision of the model to make sure you always load the same model on your SageMaker Endpoint."
  type        = string
  default     = null
}


variable "sagemaker_execution_role" {
  description = "An AWS IAM role Name to access training data and model artifacts. After the endpoint is created, the inference code might use the IAM role if it needs to access some AWS resources. If not specified, the role will created with with the `CreateModel` permissions from the [documentation](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-roles.html#sagemaker-roles-createmodel-perms)"
  type        = string
  default     = null
}

variable "autoscaling" {
  description = "A Object which defines the autoscaling target and policy for our SageMaker Endpoint. Required keys are `max_capacity` and `scaling_target_invocations` "
  type = object({
    min_capacity               = optional(number),
    max_capacity               = number,
    scaling_target_invocations = optional(number),
    scale_in_cooldown          = optional(number),
    scale_out_cooldown         = optional(number),
  })

  default = {
    min_capacity               = 1
    max_capacity               = null
    scaling_target_invocations = null
    scale_in_cooldown          = 300
    scale_out_cooldown         = 66
  }
}

variable "async_config" {
  description = "(Optional) Specifies configuration for how an endpoint performs asynchronous inference. Required key is `s3_output_path`, which is the s3 bucket used for async inference."
  type = object({
    s3_output_path    = string,
    s3_failure_path   = optional(string),
    kms_key_id        = optional(string),
    sns_error_topic   = optional(string),
    sns_success_topic = optional(string),
  })

  default = {
    s3_output_path    = null
    kms_key_id        = null
    sns_error_topic   = null
    sns_success_topic = null
  }
}

variable "serverless_config" {
  description = "(Optional) Specifies configuration for how an endpoint performs serverless inference. Required keys are `max_concurrency` and `memory_size_in_mb`"
  type = object({
    max_concurrency   = number,
    memory_size_in_mb = number
  })

  default = {
    max_concurrency   = null
    memory_size_in_mb = null
  }
}


variable "tags" {
  description = "A map of tags (key-value pairs) passed to resources."
  type        = map(string)
  default     = {}
}
