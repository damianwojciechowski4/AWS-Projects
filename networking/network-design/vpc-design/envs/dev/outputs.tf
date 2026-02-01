output "vpc_id" {
  description = "A map of VPC names to their IDs"
  value = {
    for k, v in module.vpc :
    k => v.vpc_id
  }
}

output "private_subnet_ids" {
  description = "Private Subnet IDs for each VPC"
  value = {
    for name, vpc_mod in module.vpc :
    name => vpc_mod.private_subnet_ids
  }
}
output "public_subnet_ids" {
  description = "Public Subnet IDs for each VPC"
  value = {
    for name, vpc_mod in module.vpc :
    name => vpc_mod.public_subnet_ids
  }
}