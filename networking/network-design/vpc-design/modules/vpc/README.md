# VPC Module

Reusable Terraform module to create an AWS VPC with public and private subnets.

## Usage

```hcl
module "vpc" {
  source = "../../modules/vpc"

  name      = "prod-vpc"
  vpc_cidr = "10.200.0.0/16"

  public_subnets = {
    "eu-central-1a" = "10.200.1.0/24"
  }

  private_subnets = {
    "eu-central-1a" = "10.200.101.0/24"
  }

  tags = {
    Environment = "prod"
    ManagedBy  = "terraform"
  }
}
