terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.42.0"
    }
    pagerduty = {
      source  = "pagerduty/pagerduty"
      version = "~> 3.9.0"
    }
  }

  required_version = ">= 1.7.2"
}
