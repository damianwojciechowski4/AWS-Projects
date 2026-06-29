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
