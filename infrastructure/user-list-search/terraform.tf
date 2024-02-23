

terraform {
  required_providers {
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4.2"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.38.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2.2"
    }
    pagerduty = {
      source  = "pagerduty/pagerduty"
      version = "~> 3.7.1"
    }
  }

  required_version = ">= 1.7.2"
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
