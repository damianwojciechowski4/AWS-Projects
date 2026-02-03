provider "aws" {
  region = var.aws_region
}

#create inspection vpc only at first
module "inspection_vpc" {
  source          = "../../modules/vpc"
  for_each        = var.inspection_vpc_configs
  name            = "${var.environment}-${each.key}"
  vpc_cidr        = each.value.cidr
  public_subnets  = each.value.public_subnets
  private_subnets = each.value.private_subnets
  enable_internet_gateway = true
  enable_nat_gateway = false

  tags = {
    Project     = "network-design/vpc-design"
    Environment = var.environment
    Owner       = "DW"
    Terraform   = true
    Role        = each.key
  }
}


module "spoke_vpc" {
  source          = "../../modules/vpc"
  for_each        = var.spoke_vpc_configs
  name            = "${var.environment}-${each.key}"
  vpc_cidr        = each.value.cidr
  public_subnets =  each.value.public_subnets
  private_subnets = each.value.private_subnets
  enable_internet_gateway = false
  enable_nat_gateway = false

  tags = {
  Project     = "network-design/vpc-design"
  Environment = var.environment
  Owner       = "DW"
  Terraform   = true
  Role        = each.key
  }
}