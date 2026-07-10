# VPC Module Design

**Date:** 2026-06-29  
**Project:** aws-ans-c01  
**Scope:** `modules/vpc` only — TGW module deferred to a future stage

---

## Overview

A reusable Terraform module that creates a fully functional VPC with configurable subnets across 3 AZs, public and private route tables, optional Internet Gateway, optional NAT Gateway, and optional IPv6 support. Subnets are defined as a flat map and default to the private route table unless explicitly flagged as public.

---

## Module Structure

```
aws-ans-c01/
└── modules/
    └── vpc/
        ├── main.tf
        ├── variables.tf
        ├── outputs.tf
        └── versions.tf
```

No tests for this stage. TGW module (`modules/tgw`) will be added in a future stage.

---

## Resources

| Resource | Condition | Notes |
|---|---|---|
| `aws_vpc` | always | `enable_dns_hostnames = true`; AWS-assigned `/56` added when `enable_ipv6 = true` |
| `aws_subnet` | one per `var.subnets` entry | flat map keyed by name |
| `aws_internet_gateway` | `enable_igw = true` | default `true` |
| `aws_eip` | `enable_nat_gateway = true` | one (regional) or one per AZ (per_az), placed in public subnet(s) |
| `aws_nat_gateway` | `enable_nat_gateway = true` | one (regional) or one per AZ (per_az) |
| `aws_route_table` (public) | always | single shared RT |
| `aws_route_table` (private) | always | one shared (regional) or one per AZ (per_az) |
| `aws_route_table_association` | per subnet | default → private RT; `public = true` → public RT |
| `aws_route` public default IPv4 | `enable_igw = true` | `0.0.0.0/0` → IGW |
| `aws_route` public default IPv6 | `enable_igw && enable_ipv6` | `::/0` → IGW |
| `aws_route` private default IPv4 | `enable_nat_gateway = true` | `0.0.0.0/0` → NAT GW (single or per AZ) |

---

## Variables

```hcl
variable "name" {
  description = "Name prefix used for all resource Name tags"
  type        = string
}

variable "vpc_cidr" {
  description = "IPv4 CIDR block for the VPC"
  type        = string
}

variable "subnets" {
  description = "Map of subnet name to subnet config"
  type = map(object({
    cidr   = string
    az     = string
    public = optional(bool, false)
  }))
}

variable "enable_igw" {
  description = "Create an Internet Gateway"
  type        = bool
  default     = true
}

variable "enable_nat_gateway" {
  description = "Create NAT Gateway(s)"
  type        = bool
  default     = false
}

variable "nat_gateway_mode" {
  description = "regional = one NAT GW for the whole VPC (default, uses AWS Regional NAT GW); per_az = one NAT GW per AZ with a public subnet (legacy HA pattern)"
  type        = string
  default     = "regional"
  validation {
    condition     = contains(["regional", "per_az"], var.nat_gateway_mode)
    error_message = "nat_gateway_mode must be 'regional' or 'per_az'."
  }
}

variable "enable_ipv6" {
  description = "Request an AWS-provided /56 IPv6 CIDR and assign sequential /64 blocks to subnets"
  type        = bool
  default     = false
}

variable "map_public_ip_on_launch" {
  description = "Auto-assign public IPv4 address on launch for public subnets"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags applied to all resources"
  type        = map(string)
  default     = {}
}
```

---

## IPv6 Index Assignment

When `enable_ipv6 = true`, subnets receive sequential `/64` blocks derived from the VPC's AWS-assigned `/56`:

```hcl
ipv6_cidr_block = cidrsubnet(aws_vpc.this.ipv6_cidr_block, 8, index(sorted_keys, each.key))
```

`sorted_keys = sort(keys(var.subnets))` — alphabetical sort ensures a deterministic, stable index across plan/apply cycles. With the `specs.md` naming convention (`sn-app-A`, `sn-db-A`, ...) this produces `00`, `01`, `02`... matching the spec.

---

## Route Table Design

- **Public RT** — always one, shared. Routes: `0.0.0.0/0` → IGW (when `enable_igw`), `::/0` → IGW (when `enable_igw && enable_ipv6`).
- **Private RT (regional mode)** — one shared RT for all private subnets. Route: `0.0.0.0/0` → single Regional NAT GW (when `enable_nat_gateway`).
- **Private RT (per_az mode)** — one RT per AZ. Route: `0.0.0.0/0` → NAT GW in the same AZ (when `enable_nat_gateway`).
- **Association** — subnets with `public = true` → public RT; all others → their private RT (shared or AZ-specific depending on mode).

---

## Outputs

```hcl
output "vpc_id"            # string
output "vpc_cidr"          # string
output "vpc_ipv6_cidr"     # string (empty when IPv6 disabled)
output "subnet_ids"        # map(string): name → subnet id
output "subnet_ids_by_az"  # map(list(string)): az → [subnet ids]
output "public_rt_id"      # string
output "private_rt_ids"    # map(string): az → route table id (regional mode: all AZs map to the same RT id)
output "igw_id"            # string (null when IGW disabled)
output "nat_gateway_ids"   # map(string): az → nat gateway id (regional mode: all AZs map to same id; empty when disabled)
```

`subnet_ids_by_az` is pre-shaped for TGW attachment (future stage), which requires one subnet per AZ.

---

## Example Caller (envs/dev/main.tf)

```hcl
module "vpc" {
  source  = "../../modules/vpc"

  name     = "a4l-vpc1"
  vpc_cidr = "10.16.0.0/16"

  subnets = {
    "sn-reserved-A" = { cidr = "10.16.0.0/20",   az = "eu-west-1a" }
    "sn-db-A"       = { cidr = "10.16.16.0/20",  az = "eu-west-1a" }
    "sn-app-A"      = { cidr = "10.16.32.0/20",  az = "eu-west-1a" }
    "sn-web-A"      = { cidr = "10.16.48.0/20",  az = "eu-west-1a" }

    "sn-reserved-B" = { cidr = "10.16.64.0/20",  az = "eu-west-1b" }
    "sn-db-B"       = { cidr = "10.16.80.0/20",  az = "eu-west-1b" }
    "sn-app-B"      = { cidr = "10.16.96.0/20",  az = "eu-west-1b" }
    "sn-web-B"      = { cidr = "10.16.112.0/20", az = "eu-west-1b" }

    "sn-reserved-C" = { cidr = "10.16.128.0/20", az = "eu-west-1c" }
    "sn-db-C"       = { cidr = "10.16.144.0/20", az = "eu-west-1c" }
    "sn-app-C"      = { cidr = "10.16.160.0/20", az = "eu-west-1c" }
    "sn-web-C"      = { cidr = "10.16.176.0/20", az = "eu-west-1c" }
  }

  enable_igw              = true
  enable_nat_gateway      = false
  nat_gateway_mode        = "regional"   # or "per_az" for legacy HA pattern
  enable_ipv6             = true
  map_public_ip_on_launch = false

  tags = {
    Environment = "dev"
    Project     = "aws-ans-c01"
  }
}
```

---

## Constraints

- `enable_nat_gateway = true` requires at least one subnet with `public = true` — NAT Gateways must be placed in a public subnet. If no public subnets exist, NAT GW creation is skipped.
- `map_public_ip_on_launch` applies only to subnets where `public = true`.

---

## Future Stages

- **Stage 2:** `modules/tgw` — creates Transit Gateway and accepts `vpc_id` + `subnet_ids_by_az` from VPC module output to create the attachment.
