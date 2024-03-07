terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.39.0"
    }
    pagerduty = {
      source  = "pagerduty/pagerduty"
      version = "~> 3.8.0"
    }
  }

  required_version = ">= 1.7.2"
}
