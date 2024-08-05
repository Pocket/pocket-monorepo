provider "aws" {
  default_tags {
    tags = local.tags
  }
}

provider "archive" {}

provider "null" {}