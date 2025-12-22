provider "aws" {
  region = var.aws_region
}


module "vpc" {
  source = "../../modules/vpc"

  name        = var.name
  vpc_cidr        = var.vpc_cidr
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets

  tags = {
    Project     = "vpc-design"
    Owner       = "DW"
    Environment = var.environment
    Terraform   = true
  }
}