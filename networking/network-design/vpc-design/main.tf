terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
  backend "s3" {
    bucket = "terraform-state-aws-projects-network"
    key    = "networking/network-design/vpc-design/state/terraform.tfstate"
    region = "eu-central-1"
  }



}


provider "aws" {
  region = var.aws_region
}


variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

resource "aws_s3_bucket" "example" {
  bucket = "my-test-bucket-${random_id.suffix.hex}"
  tags = {
    Name        = "test-bucket-terraform-CICD-pipeline"
    Environment = "PROD"
    IaC = "Terraform"
  }
}

resource "random_id" "suffix" {
  byte_length = 4
}

output "bucket_name" {
  description = "S3 bucket name."
  value       = aws_s3_bucket.example.id
}