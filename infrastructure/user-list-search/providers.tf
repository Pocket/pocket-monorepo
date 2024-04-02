provider "aws" {
  default_tags {
    tags = local.tags
  }
}

provider "archive" {}

provider "null" {}

provider "pagerduty" {
  token = data.aws_ssm_parameter.pagerduty_token.value
}