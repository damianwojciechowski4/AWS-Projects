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

  # All distinct AZs across all subnets — used to normalise output maps.
  all_azs = toset([for s in values(var.subnets) : s.az])
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

# ── VPC Flow Logs ──────────────────────────────────────────────────────────────
# Destination (CloudWatch Log Group / IAM role, or S3 bucket) is created outside
# this module — callers pass in an existing ARN via the flow_log_* variables.

resource "aws_flow_log" "this" {
  count = var.enable_flow_logs ? 1 : 0

  vpc_id               = aws_vpc.this.id
  traffic_type         = var.flow_log_traffic_type
  log_destination_type = var.flow_log_destination_type
  log_destination      = var.flow_log_destination_type == "s3" ? var.flow_log_s3_bucket_arn : var.flow_log_cloudwatch_log_group_arn
  iam_role_arn         = var.flow_log_destination_type == "cloud-watch-logs" ? var.flow_log_iam_role_arn : null

  tags = merge(var.tags, { Name = "${var.name}-flow-log" })

  lifecycle {
    precondition {
      condition     = var.flow_log_destination_type != "cloud-watch-logs" || (var.flow_log_cloudwatch_log_group_arn != null && var.flow_log_iam_role_arn != null)
      error_message = "flow_log_cloudwatch_log_group_arn and flow_log_iam_role_arn are required when flow_log_destination_type = 'cloud-watch-logs'."
    }
    precondition {
      condition     = var.flow_log_destination_type != "s3" || var.flow_log_s3_bucket_arn != null
      error_message = "flow_log_s3_bucket_arn is required when flow_log_destination_type = 's3'."
    }
  }
}
