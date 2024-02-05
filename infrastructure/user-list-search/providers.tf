provider "aws" {}

provider "archive" {}

provider "null" {}

provider "pagerduty" {
  token = data.aws_ssm_parameter.pagerduty_token.value
}