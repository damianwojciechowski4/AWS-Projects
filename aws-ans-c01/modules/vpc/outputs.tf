# aws-ans-c01/modules/vpc/outputs.tf

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.this.id
}

output "vpc_cidr" {
  description = "VPC IPv4 CIDR block"
  value       = aws_vpc.this.cidr_block
}

output "vpc_ipv6_cidr" {
  description = "VPC IPv6 CIDR block (empty string when IPv6 is disabled)"
  value       = var.enable_ipv6 ? aws_vpc.this.ipv6_cidr_block : ""
}

output "subnet_ids" {
  description = "Map of subnet name to subnet ID"
  value       = { for k, v in aws_subnet.this : k => v.id }
}

output "subnet_ids_by_az" {
  description = "Map of AZ to list of subnet IDs in that AZ. Pre-shaped for TGW attachment (one subnet per AZ)."
  value = {
    for az in local.all_azs :
    az => [for k, v in aws_subnet.this : v.id if var.subnets[k].az == az]
  }
}

output "public_rt_id" {
  description = "Public route table ID. This route table is always created. When enable_igw = false it has no default route — it exists for explicit route additions by the caller."
  value       = aws_route_table.public.id
}

output "private_rt_ids" {
  description = "Map of AZ to private route table ID. In regional mode all AZs map to the same RT."
  value = var.nat_gateway_mode == "regional" ? {
    for az in local.all_azs : az => aws_route_table.private_regional[0].id
    } : {
    for az, rt in aws_route_table.private_per_az : az => rt.id
  }
}

output "igw_id" {
  description = "Internet Gateway ID (null when enable_igw = false)"
  value       = var.enable_igw ? aws_internet_gateway.this[0].id : null
}

output "flow_log_id" {
  description = "VPC Flow Log ID (null when enable_flow_logs = false)"
  value       = var.enable_flow_logs ? aws_flow_log.this[0].id : null
}

output "nat_gateway_ids" {
  description = "Map of AZ to NAT Gateway ID. In regional mode all AZs map to the same gateway. Empty map when enable_nat_gateway = false."
  value = var.enable_nat_gateway ? (
    var.nat_gateway_mode == "regional" ? {
      for az in local.all_azs : az => aws_nat_gateway.regional[0].id
      } : {
      for az, gw in aws_nat_gateway.per_az : az => gw.id
    }
  ) : {}
}
