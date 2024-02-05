

terraform {
  required_providers {
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.2.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.50.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2.1"
    }
    pagerduty = {
      source  = "pagerduty/pagerduty"
      version = "~> 2.9.1"
    }
  }

  required_version = ">= 1.0.11"
}

data "terraform_remote_state" "incident_management" {
  backend = "remote"

  config = {
    organization = "Pocket"
    workspaces = {
      name = "incident-management"
    }
  }
}
