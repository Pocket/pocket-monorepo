# Hugging Face Inference SageMaker Module

Terraform module for easy deployment of a [Hugging Face Transformer models](hf.co/models) to [Amazon SageMaker](https://aws.amazon.com/de/sagemaker/) real-time endpoints. This module will create all the necessary resources to deploy a model to Amazon SageMaker including IAM roles, if not provided, SageMaker Model, SageMaker Endpoint Configuration, SageMaker endpoint.

With this module you can deploy [Hugging Face Transformer](hf.co/models) directly from the [Model Hub](hf.co/models) or from Amazon S3 to Amazon SageMaker for PyTorch and Tensorflow based models.

## Usage

**basic example**

```hcl
module "sagemaker-huggingface" {
  source               = "philschmid/sagemaker-huggingface/aws"
  version              = "0.5.0"
  name_prefix          = "distilbert"
  pytorch_version      = "1.9.1"
  transformers_version = "4.12.3"
  instance_type        = "ml.g4dn.xlarge"
  instance_count       = 1 # default is 1
  hf_model_id          = "distilbert-base-uncased-finetuned-sst-2-english"
  hf_task              = "text-classification"
}
```

**advanced example with autoscaling**

```hcl
module "sagemaker-huggingface" {
  source               = "philschmid/sagemaker-huggingface/aws"
  version              = "0.5.0"
  name_prefix          = "distilbert"
  pytorch_version      = "1.9.1"
  transformers_version = "4.12.3"
  instance_type        = "ml.g4dn.xlarge"
  hf_model_id          = "distilbert-base-uncased-finetuned-sst-2-english"
  hf_task              = "text-classification"
  autoscaling = {
    max_capacity               = 4   # The max capacity of the scalable target
    scaling_target_invocations = 200 # The scaling target invocations (requests/minute)
  }
}
```

**examples:**
* [Deploy Model from hf.co/models](https://github.com/philschmid/terraform-aws-sagemaker-huggingface/tree/master/examples/deploy_from_hub)
* [Deploy Model from Amazon S3](https://github.com/philschmid/terraform-aws-sagemaker-huggingface/tree/master/examples/deploy_from_s3)
* [Deploy Private Models from hf.co/models](https://github.com/philschmid/terraform-aws-sagemaker-huggingface/tree/master/examples/deploy_private_model)
* [Autoscaling Endpoint](https://github.com/philschmid/terraform-aws-sagemaker-huggingface/tree/master/examples/autoscaling_example)
* [Asynchronous Inference](https://github.com/philschmid/terraform-aws-sagemaker-huggingface/tree/master/examples/async_inference)
* [Serverless Inference](https://github.com/philschmid/terraform-aws-sagemaker-huggingface/tree/master/examples/serverless_inference)
* [Tensorflow example](https://github.com/philschmid/terraform-aws-sagemaker-huggingface/tree/master/examples/tensorflow_example)
* [Deploy Model with existing IAM role](https://github.com/philschmid/terraform-aws-sagemaker-huggingface/tree/master/examples/use_existing_iam_role)


## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.0.0 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | ~> 4.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | 3.74.0 |
| <a name="provider_random"></a> [random](#provider\_random) | n/a |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [aws_appautoscaling_policy.sagemaker_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/appautoscaling_policy) | resource |
| [aws_appautoscaling_target.sagemaker_target](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/appautoscaling_target) | resource |
| [aws_iam_role.new_role](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role) | resource |
| [aws_sagemaker_endpoint.huggingface](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sagemaker_endpoint) | resource |
| [aws_sagemaker_endpoint_configuration.huggingface](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sagemaker_endpoint_configuration) | resource |
| [aws_sagemaker_endpoint_configuration.huggingface_async](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sagemaker_endpoint_configuration) | resource |
| [aws_sagemaker_endpoint_configuration.huggingface_serverless](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sagemaker_endpoint_configuration) | resource |
| [aws_sagemaker_model.model_with_hub_model](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sagemaker_model) | resource |
| [aws_sagemaker_model.model_with_model_artifact](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sagemaker_model) | resource |
| [random_string.resource_id](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/string) | resource |
| [aws_iam_role.get_role](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_role) | data source |
| [aws_sagemaker_prebuilt_ecr_image.deploy_image](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/sagemaker_prebuilt_ecr_image) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_async_config"></a> [async\_config](#input\_async\_config) | (Optional) Specifies configuration for how an endpoint performs asynchronous inference. Required key is `s3_output_path`, which is the s3 bucket used for async inference. | <pre>object({<br>    s3_output_path     = string,<br>    s3_failure_path    = optional(string),<br>    kms_key_id         = optional(string),<br>    sns_error_topic    = optional(string),<br>    sns_success_topic  = optional(string),<br>  })</pre> | <pre>{<br>  "kms_key_id": null,<br>  "s3_output_path": null,<br>  "s3_failure_path": null,<br>  "sns_error_topic": null,<br>  "sns_success_topic": null<br>}</pre> | no |
| <a name="input_autoscaling"></a> [autoscaling](#input\_autoscaling) | A Object which defines the autoscaling target and policy for our SageMaker Endpoint. Required keys are `max_capacity` and `scaling_target_invocations` | <pre>object({<br>    min_capacity               = optional(number),<br>    max_capacity               = number,<br>    scaling_target_invocations = optional(number),<br>    scale_in_cooldown          = optional(number),<br>    scale_out_cooldown         = optional(number),<br>  })</pre> | <pre>{<br>  "max_capacity": null,<br>  "min_capacity": 1,<br>  "scale_in_cooldown": 300,<br>  "scale_out_cooldown": 66,<br>  "scaling_target_invocations": null<br>}</pre> | no |
| <a name="input_hf_api_token"></a> [hf\_api\_token](#input\_hf\_api\_token) | The HF\_API\_TOKEN environment variable defines the your Hugging Face authorization token. The HF\_API\_TOKEN is used as a HTTP bearer authorization for remote files, like private models. You can find your token at your settings page. | `string` | `null` | no |
| <a name="input_hf_model_id"></a> [hf\_model\_id](#input\_hf\_model\_id) | The HF\_MODEL\_ID environment variable defines the model id, which will be automatically loaded from [hf.co/models](https://huggingface.co/models) when creating or SageMaker Endpoint. | `string` | `null` | no |
| <a name="input_hf_model_revision"></a> [hf\_model\_revision](#input\_hf\_model\_revision) | The HF\_MODEL\_REVISION is an extension to HF\_MODEL\_ID and allows you to define/pin a revision of the model to make sure you always load the same model on your SageMaker Endpoint. | `string` | `null` | no |
| <a name="input_hf_task"></a> [hf\_task](#input\_hf\_task) | The HF\_TASK environment variable defines the task for the used 🤗 Transformers pipeline. A full list of tasks can be find [here](https://huggingface.co/transformers/main_classes/pipelines.html). | `string` | n/a | yes |
| <a name="input_image_tag"></a> [image\_tag](#input\_image\_tag) | The image tag you want to use for the container you want to use. Defaults to `None`. The module tries to derive the `image_tag` from the `pytorch_version`, `tensorflow_version` & `instance_type`. If you want to override this, you can provide the `image_tag` as a variable. | `string` | `null` | no |
| <a name="input_instance_count"></a> [instance\_count](#input\_instance\_count) | The initial number of instances to run in the Endpoint created from this Model. Defaults to 1. | `number` | `1` | no |
| <a name="input_instance_type"></a> [instance\_type](#input\_instance\_type) | The EC2 instance type to deploy this Model to. For example, `ml.p2.xlarge`. | `string` | `null` | no |
| <a name="input_model_data"></a> [model\_data](#input\_model\_data) | The S3 location of a SageMaker model data .tar.gz file (default: None). Not needed when using `hf_model_id`. | `string` | `null` | no |
| <a name="input_name_prefix"></a> [name\_prefix](#input\_name\_prefix) | A prefix used for naming resources. | `string` | n/a | yes |
| <a name="input_pytorch_version"></a> [pytorch\_version](#input\_pytorch\_version) | PyTorch version you want to use for executing your inference code. Defaults to `None`. Required unless `tensorflow_version` is provided. [List of supported versions](https://huggingface.co/docs/sagemaker/reference#inference-dlc-overview) | `string` | `null` | no |
| <a name="input_sagemaker_execution_role"></a> [sagemaker\_execution\_role](#input\_sagemaker\_execution\_role) | An AWS IAM role Name to access training data and model artifacts. After the endpoint is created, the inference code might use the IAM role if it needs to access some AWS resources. If not specified, the role will created with with the `CreateModel` permissions from the [documentation](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-roles.html#sagemaker-roles-createmodel-perms) | `string` | `null` | no |
| <a name="input_serverless_config"></a> [serverless\_config](#input\_serverless\_config) | (Optional) Specifies configuration for how an endpoint performs serverless inference. Required keys are `max_concurrency` and `memory_size_in_mb` | <pre>object({<br>    max_concurrency   = number,<br>    memory_size_in_mb = number<br>})</pre> | <pre>{<br>  "max_concurrency": null,<br>  "memory_size_in_mb": null<br>}</pre> | no |
| <a name="input_tags"></a> [tags](#input\_tags) | A map of tags (key-value pairs) passed to resources. | `map(string)` | `{}` | no |
| <a name="input_tensorflow_version"></a> [tensorflow\_version](#input\_tensorflow\_version) | TensorFlow version you want to use for executing your inference code. Defaults to `None`. Required unless `pytorch_version` is provided. [List of supported versions](https://huggingface.co/docs/sagemaker/reference#inference-dlc-overview) | `string` | `null` | no |
| <a name="input_transformers_version"></a> [transformers\_version](#input\_transformers\_version) | Transformers version you want to use for executing your model training code. Defaults to None. [List of supported versions](https://huggingface.co/docs/sagemaker/reference#inference-dlc-overview) | `string` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_iam_role"></a> [iam\_role](#output\_iam\_role) | IAM role used in the endpoint |
| <a name="output_sagemaker_endpoint"></a> [sagemaker\_endpoint](#output\_sagemaker\_endpoint) | created Amazon SageMaker endpoint resource |
| <a name="output_sagemaker_endpoint_configuration"></a> [sagemaker\_endpoint\_configuration](#output\_sagemaker\_endpoint\_configuration) | created Amazon SageMaker endpoint configuration resource |
| <a name="output_sagemaker_endpoint_name"></a> [sagemaker\_endpoint\_name](#output\_sagemaker\_endpoint\_name) | Name of the created Amazon SageMaker endpoint, used for invoking the endpoint, with sdks |
| <a name="output_sagemaker_model"></a> [sagemaker\_model](#output\_sagemaker\_model) | created Amazon SageMaker model resource |
| <a name="output_tags"></a> [tags](#output\_tags) | n/a |
| <a name="output_used_container"></a> [used\_container](#output\_used\_container) | Used container for creating the endpoint |

## License

MIT License. See [LICENSE](LICENSE) for full details.


