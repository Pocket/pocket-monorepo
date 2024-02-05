terraform {
  backend "s3" {
    bucket         = "mozilla-pocket-team-dev-terraform-state"
    dynamodb_table = "mozilla-pocket-team-dev-terraform-state"
    key            = "UserListSearch"
    region         = "us-east-1"
  }
}

locals {
    old_workspace = "UserListSearch-Prod"
}