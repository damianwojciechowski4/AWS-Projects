output "vpc_id" {
  value = module.vpc.vpc_id
}

output "vpc_ipv6_cidr" {
  value = module.vpc.vpc_ipv6_cidr
}

output "subnet_ids" {
  value = module.vpc.subnet_ids
}

output "subnet_ids_by_az" {
  value = module.vpc.subnet_ids_by_az
}

output "public_rt_id" {
  value = module.vpc.public_rt_id
}

output "private_rt_ids" {
  value = module.vpc.private_rt_ids
}

output "igw_id" {
  value = module.vpc.igw_id
}
