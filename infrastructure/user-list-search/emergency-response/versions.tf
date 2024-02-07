terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.35.0"
    }
    pagerduty = {
      source  = "pagerduty/pagerduty"
      version = "~> 3.7.1"
    }
  }

  required_version = ">= 1.7.2"
}
