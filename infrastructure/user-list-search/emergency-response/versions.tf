terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.50.0"
    }
    pagerduty = {
      source  = "pagerduty/pagerduty"
      version = "~> 2.9.1"
    }
  }

  required_version = ">= 1.0.11"
}
