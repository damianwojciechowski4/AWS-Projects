variable "name" {
  description = "Name prefix used for all resource Name tags"
  type        = string
}

variable "vpc_cidr" {
  description = "IPv4 CIDR block for the VPC"
  type        = string
}

variable "subnets" {
  description = "Map of subnet name to subnet config. Subnets with public = true are associated with the public route table; all others use the private route table."
  type = map(object({
    cidr   = string
    az     = string
    public = optional(bool, false)
  }))
}

variable "enable_igw" {
  description = "Create an Internet Gateway and attach it to the VPC"
  type        = bool
  default     = true
}

variable "enable_nat_gateway" {
  description = "Create NAT Gateway(s) for private subnet internet egress. Requires at least one subnet with public = true."
  type        = bool
  default     = false
}

variable "nat_gateway_mode" {
  description = "regional = one NAT GW for the whole VPC placed in the first public subnet (cross-AZ data transfer charges eliminated by AWS in 2024); per_az = one NAT GW per AZ with a public subnet for strict AZ isolation. NOTE: per_az mode requires at least one public and one private subnet in every AZ — AZs with only private subnets will have a private route table with no default route."
  type        = string
  default     = "regional"

  validation {
    condition     = contains(["regional", "per_az"], var.nat_gateway_mode)
    error_message = "nat_gateway_mode must be 'regional' or 'per_az'."
  }
}

variable "enable_ipv6" {
  description = "Request an AWS-provided /56 IPv6 CIDR block for the VPC and assign sequential /64 blocks to each subnet. All subnets (including private) receive IPv6 addresses. Private subnets have no ::/0 IPv6 egress route — an Egress-Only Internet Gateway is required for IPv6 egress from private subnets and is out of scope for this module."
  type        = bool
  default     = false
}

variable "map_public_ip_on_launch" {
  description = "Auto-assign a public IPv4 address to instances launched in public subnets (subnets with public = true)"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags merged onto all resources"
  type        = map(string)
  default     = {}
}
