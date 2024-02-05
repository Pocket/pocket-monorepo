terraform {
  backend "s3" {
    bucket         = "mozilla-pocket-team-prod-terraform-state"
    dynamodb_table = "mozilla-pocket-team-prod-terraform-state"
    key            = "UserListSearch"
    region         = "us-east-1"
  }
}

locals {
    old_workspace = "UserListSearch-Prod"
}