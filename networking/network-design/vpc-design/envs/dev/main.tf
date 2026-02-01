provider "aws" {
  region = var.aws_region
}


module "spoke_a" {
  source = "../../modules/vpc"
  for_each = var.vpc_configs
  name            = "${var.environment}-${each.key}"
  vpc_cidr        = each.value.cidr
  public_subnets  = each.value.public_subnets
  private_subnets = each.value.private_subnets

  tags = {
    Project     = "network-design/vpc-design"
    Environment = var.environment
    Owner       = "DW"
    Terraform   = true
    Role = each.key
  }
}