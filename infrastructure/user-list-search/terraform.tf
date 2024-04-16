

terraform {
  required_providers {
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4.2"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.44.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2.2"
    }
    pagerduty = {
      source  = "pagerduty/pagerduty"
      version = "~> 3.11.0"
    }
  }

  required_version = ">= 1.8.0"
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
