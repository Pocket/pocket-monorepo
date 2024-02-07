provider "aws" {
  region = var.region
}

provider "pagerduty" {
  token = data.aws_ssm_parameter.pagerduty_token.value
}

terraform {
  backend "remote" {
    organization = "Pocket"
    hostname     = "app.terraform.io"

    workspaces {
      prefix = "push-server-"
    }
  }

  required_providers {
    pagerduty = {
      source  = "pagerduty/pagerduty"
      version = ">= 2.2.1"
    }
  }
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


module "container-data" {
  source = "../modules/push-container-data"
}

locals {
  #Define a prefix for CirlceCI params so they do not get loaded into the app.
  circle_prefix = "/${var.service_name}/CircleCI/${var.environment}/"

  container_credential = "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:Shared/DockerHub"

  #Main repo context
  repo_context = {
    name = "${var.service_name}-${var.environment}"
  }

  #Check to see if a service hash was passed in. If not use the one in SSM
  service_hash = var.service_hash == null ? data.aws_ssm_parameter.service_hash.value : var.service_hash

  tags = {
    service     = var.service_name
    environment = var.environment
  }
}

