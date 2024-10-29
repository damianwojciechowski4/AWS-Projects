terraform {
  required_version = ">=1.0.0"

  backend "s3" {}
}

provider "aws" {
    region = var.aws_region  
}

data "aws_availability_zones" "available" {}
data "aws_region" "current" {}