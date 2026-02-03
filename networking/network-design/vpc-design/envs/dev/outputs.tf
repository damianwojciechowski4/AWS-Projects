output "inspection_vpc_id" {
  description = "Inspection VPC ID"
  value       = module.inspection_vpc["inspection"].vpc_id
  }

output "spoke_vpc_id" {
  description = "Spoke VPC IDs"
  value = {
    for name, vpc_mod in module.spoke_vpc :
    name => vpc_mod.vpc_id
  }
}

output "inspection_private_subnet_ids" {
  description = "Private Subnet IDs for each VPC"
  value = {
    for name, vpc_mod in module.inspection_vpc:
    name => vpc_mod.private_subnet_ids
  }
}
output "inspectionpublic_subnet_ids" {
  description = "Public Subnet IDs for each VPC"
  value = {
    for name, vpc_mod in module.inspection_vpc:
    name => vpc_mod.public_subnet_ids
  }
}

output "spoke_private_subnet_ids" {
  description = "Private subnets for spoke VPCs"
  value = {
    for name, vpc_mod in module.spoke_vpc:
    name => vpc_mod.private_subnet_ids
  }
}