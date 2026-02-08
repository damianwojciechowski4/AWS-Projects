provider "aws" {
  region = var.aws_region
}

#create inspection vpc only at first
module "inspection_vpc" {
  source                  = "../../modules/vpc"
  for_each                = var.inspection_vpc_configs
  name                    = "${var.environment}-${each.key}"
  vpc_cidr                = each.value.cidr
  public_subnets          = each.value.public_subnets
  private_subnets         = each.value.private_subnets
  enable_internet_gateway = true
  enable_nat_gateway      = false

  #Tags
  tags = merge(local.common_tags, {
    Role = each.key
    Name = "${var.environment}-${each.key}"
  })
}


module "spoke_vpc" {
  source                  = "../../modules/vpc"
  for_each                = var.spoke_vpc_configs
  name                    = "${var.environment}-${each.key}"
  vpc_cidr                = each.value.cidr
  public_subnets          = each.value.public_subnets
  private_subnets         = each.value.private_subnets
  enable_internet_gateway = false
  enable_nat_gateway      = false

  #Tags
  tags = merge(local.common_tags, {
    Role = each.key
    Name = "${var.environment}-${each.key}"
  })
}


module "inspection_security_group" {
  source          = "../../modules/security_group"
  environment     = var.environment
  vpc_id          = module.inspection_vpc["inspection"].vpc_id
  security_groups = var.inspection_security_groups

  # Tags
  tags = merge(local.common_tags, {
    Role = "inspection"
  })


}

