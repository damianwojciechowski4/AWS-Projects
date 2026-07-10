# VPC Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable `modules/vpc` Terraform module for `aws-ans-c01` that creates a VPC, configurable named subnets across 3 AZs, public/private route tables, optional IGW, optional NAT Gateway (regional or per-AZ mode), and optional IPv6.

**Architecture:** A single `modules/vpc` Terraform module with a flat subnet map input. Public and private route tables are always created. Subnets default to the private RT unless `public = true`. IPv6 uses AWS-assigned `/56` with sequential `/64` blocks assigned by sorted subnet name. NAT Gateway supports `regional` (one GW, one shared private RT) and `per_az` (one GW per AZ, one RT per AZ) modes. An example environment is wired up in `envs/dev`.

**Tech Stack:** Terraform >= 1.7, AWS Provider ~> 6.0, AWS

## Global Constraints

> **`per_az` mode constraint:** When `nat_gateway_mode = "per_az"`, every AZ that has private subnets must also have at least one public subnet. The private RT in each AZ routes to the NAT GW in the same AZ — if no public subnet exists in that AZ, no NAT GW is created there and the private default route is skipped for that AZ.

- Terraform minimum version: `>= 1.7.0` (required for `optional()` in object variables)
- AWS provider: `~> 6.0`
- All resources tagged with `var.tags` merged with a `Name` tag
- No Terraform tests in this stage
- Module lives at `aws-ans-c01/modules/vpc/`
- `nat_gateway_mode` valid values: `"regional"` or `"per_az"` only

---

### Task 1: Scaffold module — versions.tf and empty stubs

**Files:**
- Create: `aws-ans-c01/modules/vpc/versions.tf`
- Create: `aws-ans-c01/modules/vpc/variables.tf` (empty stub)
- Create: `aws-ans-c01/modules/vpc/main.tf` (empty stub)
- Create: `aws-ans-c01/modules/vpc/outputs.tf` (empty stub)

- [ ] **Step 1: Create versions.tf**

```hcl
# aws-ans-c01/modules/vpc/versions.tf
terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}
```

- [ ] **Step 2: Create empty stubs**

Create `aws-ans-c01/modules/vpc/variables.tf` with content:
```hcl
# variables — defined in Task 2
```

Create `aws-ans-c01/modules/vpc/main.tf` with content:
```hcl
# resources — defined in Tasks 3-5
```

Create `aws-ans-c01/modules/vpc/outputs.tf` with content:
```hcl
# outputs — defined in Task 6
```

- [ ] **Step 3: Commit**

```bash
git add aws-ans-c01/modules/vpc/
git commit -m "feat(vpc): scaffold module files"
```

---

### Task 2: variables.tf — all module inputs

**Files:**
- Modify: `aws-ans-c01/modules/vpc/variables.tf`

**Interfaces:**
- Produces: `var.name`, `var.vpc_cidr`, `var.subnets`, `var.enable_igw`, `var.enable_nat_gateway`, `var.nat_gateway_mode`, `var.enable_ipv6`, `var.map_public_ip_on_launch`, `var.tags` — consumed by Tasks 3–6

- [ ] **Step 1: Write variables.tf**

```hcl
# aws-ans-c01/modules/vpc/variables.tf

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
  description = "regional = one NAT GW for the whole VPC placed in the first public subnet (cross-AZ data transfer charges eliminated by AWS in 2024); per_az = one NAT GW per AZ with a public subnet for strict AZ isolation."
  type        = string
  default     = "regional"

  validation {
    condition     = contains(["regional", "per_az"], var.nat_gateway_mode)
    error_message = "nat_gateway_mode must be 'regional' or 'per_az'."
  }
}

variable "enable_ipv6" {
  description = "Request an AWS-provided /56 IPv6 CIDR block for the VPC and assign sequential /64 blocks to each subnet"
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
```

- [ ] **Step 2: Validate syntax**

```bash
cd aws-ans-c01/modules/vpc && terraform init -backend=false && terraform validate
```

Expected: `Success! The configuration is valid.`

- [ ] **Step 3: Commit**

```bash
git add aws-ans-c01/modules/vpc/variables.tf
git commit -m "feat(vpc): add module variables"
```

---

### Task 3: main.tf — locals, VPC, subnets

**Files:**
- Modify: `aws-ans-c01/modules/vpc/main.tf`

**Interfaces:**
- Consumes: `var.name`, `var.vpc_cidr`, `var.subnets`, `var.enable_ipv6`, `var.map_public_ip_on_launch`, `var.tags`
- Produces: `aws_vpc.this`, `aws_subnet.this`, `local.public_subnets`, `local.private_subnets`, `local.private_azs`, `local.public_subnet_per_az`, `local.sorted_subnet_keys` — consumed by Tasks 4–6

- [ ] **Step 1: Write locals, VPC, and subnets**

Replace the stub content of `aws-ans-c01/modules/vpc/main.tf` with:

```hcl
# aws-ans-c01/modules/vpc/main.tf

locals {
  # Sorted keys give a stable IPv6 /64 index regardless of map insertion order.
  # sn-app-A → index 0 → :00::/64, sn-app-B → index 1 → :01::/64, etc.
  sorted_subnet_keys = sort(keys(var.subnets))

  public_subnets  = { for k, v in var.subnets : k => v if v.public }
  private_subnets = { for k, v in var.subnets : k => v if !v.public }

  # Distinct AZs that contain at least one private subnet — used for per_az RT creation.
  private_azs = toset([for k, v in local.private_subnets : v.az])

  # One representative public subnet name per AZ — used to place per-AZ NAT GWs.
  public_subnet_per_az = {
    for az in toset([for k, v in local.public_subnets : v.az]) :
    az => [for k, v in local.public_subnets : k if v.az == az][0]
  }
}

# ── VPC ────────────────────────────────────────────────────────────────────────

resource "aws_vpc" "this" {
  cidr_block                       = var.vpc_cidr
  assign_generated_ipv6_cidr_block = var.enable_ipv6
  enable_dns_hostnames             = true
  enable_dns_support               = true

  tags = merge(var.tags, { Name = var.name })
}

# ── Subnets ────────────────────────────────────────────────────────────────────

resource "aws_subnet" "this" {
  for_each = var.subnets

  vpc_id            = aws_vpc.this.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az

  # Sequential /64 from the VPC's /56. Index is position in the sorted key list.
  ipv6_cidr_block                 = var.enable_ipv6 ? cidrsubnet(aws_vpc.this.ipv6_cidr_block, 8, index(local.sorted_subnet_keys, each.key)) : null
  assign_ipv6_address_on_creation = var.enable_ipv6

  # Public IPv4 assignment only applies to public subnets when the flag is set.
  map_public_ip_on_launch = each.value.public && var.map_public_ip_on_launch

  tags = merge(var.tags, {
    Name = "${var.name}-${each.key}"
    Tier = each.value.public ? "public" : "private"
  })
}
```

- [ ] **Step 2: Validate**

```bash
cd aws-ans-c01/modules/vpc && terraform validate
```

Expected: `Success! The configuration is valid.`

- [ ] **Step 3: Commit**

```bash
git add aws-ans-c01/modules/vpc/main.tf
git commit -m "feat(vpc): add VPC and subnet resources with IPv6 support"
```

---

### Task 4: main.tf — Internet Gateway and public route table

**Files:**
- Modify: `aws-ans-c01/modules/vpc/main.tf` (append)

**Interfaces:**
- Consumes: `aws_vpc.this`, `aws_subnet.this`, `local.public_subnets`, `var.enable_igw`, `var.enable_ipv6`, `var.name`, `var.tags`
- Produces: `aws_internet_gateway.this`, `aws_route_table.public`, `aws_route_table_association.public` — consumed by Tasks 5 (depends_on) and 6 (outputs)

- [ ] **Step 1: Append IGW and public RT to main.tf**

```hcl
# ── Internet Gateway ───────────────────────────────────────────────────────────

resource "aws_internet_gateway" "this" {
  count  = var.enable_igw ? 1 : 0
  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, { Name = "${var.name}-igw" })
}

# ── Public route table ─────────────────────────────────────────────────────────

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, { Name = "${var.name}-public-rt" })
}

resource "aws_route" "public_ipv4_default" {
  count = var.enable_igw ? 1 : 0

  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this[0].id
}

resource "aws_route" "public_ipv6_default" {
  count = var.enable_igw && var.enable_ipv6 ? 1 : 0

  route_table_id              = aws_route_table.public.id
  destination_ipv6_cidr_block = "::/0"
  gateway_id                  = aws_internet_gateway.this[0].id
}

resource "aws_route_table_association" "public" {
  for_each = local.public_subnets

  subnet_id      = aws_subnet.this[each.key].id
  route_table_id = aws_route_table.public.id
}
```

- [ ] **Step 2: Validate**

```bash
cd aws-ans-c01/modules/vpc && terraform validate
```

Expected: `Success! The configuration is valid.`

- [ ] **Step 3: Commit**

```bash
git add aws-ans-c01/modules/vpc/main.tf
git commit -m "feat(vpc): add internet gateway and public route table"
```

---

### Task 5: main.tf — NAT Gateway and private route tables

**Files:**
- Modify: `aws-ans-c01/modules/vpc/main.tf` (append)

**Interfaces:**
- Consumes: `aws_vpc.this`, `aws_subnet.this`, `aws_internet_gateway.this`, `local.private_subnets`, `local.private_azs`, `local.public_subnet_per_az`, `var.enable_nat_gateway`, `var.nat_gateway_mode`, `var.name`, `var.tags`
- Produces: `aws_nat_gateway.regional`, `aws_nat_gateway.per_az`, `aws_route_table.private_regional`, `aws_route_table.private_per_az` — consumed by Task 6 (outputs)

- [ ] **Step 1: Append NAT GW and private RTs to main.tf**

```hcl
# ── NAT Gateway — regional mode (one GW, any public subnet) ───────────────────

resource "aws_eip" "nat_regional" {
  count  = var.enable_nat_gateway && var.nat_gateway_mode == "regional" ? 1 : 0
  domain = "vpc"

  tags = merge(var.tags, { Name = "${var.name}-nat-eip" })
}

resource "aws_nat_gateway" "regional" {
  count = var.enable_nat_gateway && var.nat_gateway_mode == "regional" ? 1 : 0

  allocation_id = aws_eip.nat_regional[0].id
  # Place in the first public subnet (sorted for determinism).
  subnet_id     = aws_subnet.this[sort(keys(local.public_subnets))[0]].id

  tags = merge(var.tags, { Name = "${var.name}-nat" })

  depends_on = [aws_internet_gateway.this]
}

# ── NAT Gateway — per_az mode (one GW per AZ) ─────────────────────────────────

resource "aws_eip" "nat_per_az" {
  for_each = var.enable_nat_gateway && var.nat_gateway_mode == "per_az" ? local.public_subnet_per_az : {}
  domain   = "vpc"

  tags = merge(var.tags, { Name = "${var.name}-nat-eip-${each.key}" })
}

resource "aws_nat_gateway" "per_az" {
  for_each = var.enable_nat_gateway && var.nat_gateway_mode == "per_az" ? local.public_subnet_per_az : {}

  allocation_id = aws_eip.nat_per_az[each.key].id
  subnet_id     = aws_subnet.this[each.value].id

  tags = merge(var.tags, { Name = "${var.name}-nat-${each.key}" })

  depends_on = [aws_internet_gateway.this]
}

# ── Private route table — regional mode (one shared RT) ───────────────────────

resource "aws_route_table" "private_regional" {
  count  = var.nat_gateway_mode == "regional" ? 1 : 0
  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, { Name = "${var.name}-private-rt" })
}

resource "aws_route" "private_default_regional" {
  count = var.enable_nat_gateway && var.nat_gateway_mode == "regional" ? 1 : 0

  route_table_id         = aws_route_table.private_regional[0].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.regional[0].id
}

resource "aws_route_table_association" "private_regional" {
  for_each = var.nat_gateway_mode == "regional" ? local.private_subnets : {}

  subnet_id      = aws_subnet.this[each.key].id
  route_table_id = aws_route_table.private_regional[0].id
}

# ── Private route table — per_az mode (one RT per AZ) ─────────────────────────

resource "aws_route_table" "private_per_az" {
  for_each = var.nat_gateway_mode == "per_az" ? local.private_azs : toset([])
  vpc_id   = aws_vpc.this.id

  tags = merge(var.tags, { Name = "${var.name}-private-rt-${each.key}" })
}

resource "aws_route" "private_default_per_az" {
  for_each = var.enable_nat_gateway && var.nat_gateway_mode == "per_az" ? local.public_subnet_per_az : {}

  route_table_id         = aws_route_table.private_per_az[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.per_az[each.key].id
}

resource "aws_route_table_association" "private_per_az" {
  for_each = var.nat_gateway_mode == "per_az" ? local.private_subnets : {}

  subnet_id      = aws_subnet.this[each.key].id
  route_table_id = aws_route_table.private_per_az[var.subnets[each.key].az].id
}
```

- [ ] **Step 2: Validate**

```bash
cd aws-ans-c01/modules/vpc && terraform validate
```

Expected: `Success! The configuration is valid.`

- [ ] **Step 3: Commit**

```bash
git add aws-ans-c01/modules/vpc/main.tf
git commit -m "feat(vpc): add NAT gateway and private route tables (regional and per_az modes)"
```

---

### Task 6: outputs.tf

**Files:**
- Modify: `aws-ans-c01/modules/vpc/outputs.tf`

**Interfaces:**
- Consumes: `aws_vpc.this`, `aws_subnet.this`, `aws_internet_gateway.this`, `aws_route_table.public`, `aws_route_table.private_regional`, `aws_route_table.private_per_az`, `aws_nat_gateway.regional`, `aws_nat_gateway.per_az`, `local.all_azs` (add to locals in main.tf — see Step 1)
- Produces: all module outputs consumed by env callers and future TGW module

- [ ] **Step 1: Add `all_azs` to locals in main.tf**

In `aws-ans-c01/modules/vpc/main.tf`, add `all_azs` inside the existing `locals` block:

```hcl
  # All distinct AZs across all subnets — used to normalise output maps.
  all_azs = toset([for s in values(var.subnets) : s.az])
```

- [ ] **Step 2: Write outputs.tf**

Replace the stub content of `aws-ans-c01/modules/vpc/outputs.tf` with:

```hcl
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
  description = "Public route table ID"
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
```

- [ ] **Step 3: Validate**

```bash
cd aws-ans-c01/modules/vpc && terraform validate
```

Expected: `Success! The configuration is valid.`

- [ ] **Step 4: Commit**

```bash
git add aws-ans-c01/modules/vpc/main.tf aws-ans-c01/modules/vpc/outputs.tf
git commit -m "feat(vpc): add outputs"
```

---

### Task 7: Wire up envs/dev

**Files:**
- Create: `aws-ans-c01/envs/dev/versions.tf`
- Create: `aws-ans-c01/envs/dev/provider.tf`
- Create: `aws-ans-c01/envs/dev/variables.tf`
- Create: `aws-ans-c01/envs/dev/terraform.tfvars`
- Create: `aws-ans-c01/envs/dev/main.tf`
- Create: `aws-ans-c01/envs/dev/outputs.tf`

**Interfaces:**
- Consumes: `modules/vpc` outputs: `vpc_id`, `subnet_ids`, `subnet_ids_by_az`, `public_rt_id`, `private_rt_ids`, `igw_id`

- [ ] **Step 1: Create versions.tf**

```hcl
# aws-ans-c01/envs/dev/versions.tf
terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}
```

- [ ] **Step 2: Create provider.tf**

```hcl
# aws-ans-c01/envs/dev/provider.tf
provider "aws" {
  region = var.aws_region
}
```

- [ ] **Step 3: Create variables.tf**

```hcl
# aws-ans-c01/envs/dev/variables.tf
variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "eu-west-1"
}
```

- [ ] **Step 4: Create terraform.tfvars**

```hcl
# aws-ans-c01/envs/dev/terraform.tfvars
aws_region = "eu-west-1"
```

- [ ] **Step 5: Create main.tf**

```hcl
# aws-ans-c01/envs/dev/main.tf
module "vpc" {
  source = "../../modules/vpc"

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
  nat_gateway_mode        = "regional"
  enable_ipv6             = true
  map_public_ip_on_launch = false

  tags = {
    Environment = "dev"
    Project     = "aws-ans-c01"
  }
}
```

- [ ] **Step 6: Create outputs.tf**

```hcl
# aws-ans-c01/envs/dev/outputs.tf
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
```

- [ ] **Step 7: Init and validate the env**

```bash
cd aws-ans-c01/envs/dev && terraform init && terraform validate
```

Expected: `Success! The configuration is valid.`

- [ ] **Step 8: Run plan to verify resource count (no apply needed)**

```bash
cd aws-ans-c01/envs/dev && terraform plan
```

Expected plan with `enable_nat_gateway = false` and `enable_ipv6 = true`:
- 1 VPC
- 12 subnets (each with an IPv6 `/64`)
- 1 Internet Gateway
- 1 public route table + 1 IPv4 default route + 1 IPv6 default route
- 1 private route table (regional mode, no NAT GW routes)
- 0 NAT Gateways / EIPs (disabled)
- 12 route table associations (0 public, 12 private — all subnets are private in this example)

Total: `Plan: 29 to add, 0 to change, 0 to destroy.`

- [ ] **Step 9: Commit**

```bash
git add aws-ans-c01/envs/dev/
git commit -m "feat(vpc): wire up envs/dev example"
```
