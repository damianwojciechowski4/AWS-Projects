resource "aws_vpc" "this" {
  cidr_block = var.vpc_cidr

  tags = merge(
    var.tags,
    {
      Name = var.name
    }
  )
}

resource "aws_subnet" "public" {
  # iterrate over the public subnets
  for_each          = var.public_subnets
  vpc_id            = aws_vpc.this.id
  cidr_block        = each.value
  availability_zone = each.key

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-public-${each.key}"
      Tier = "public"
    }
  )
}

resource "aws_subnet" "private" {
  for_each = var.private_subnets
  vpc_id            = aws_vpc.this.id
  cidr_block        = each.value
  availability_zone = each.key

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-private-${each.key}"
      Tier = "private"
    }
  )
}

resource "aws_internet_gateway" "igw" {
  count  = var.enable_internet_gateway ? 1 : 0
  vpc_id = aws_vpc.this.id


  tags = merge(
    var.tags,
    {
      Name = "${var.name}-igw"
    }
  )
}

resource "aws_route_table" "public-rt" {
  count  = var.enable_internet_gateway ? 1 : 0
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    # Access the first (and only) element of the list when count is 1
    gateway_id = aws_internet_gateway.igw[0].id
  }

  route {
    ipv6_cidr_block = "::/0"
    # Access the first (and only) element of the list when count is 1
    gateway_id      = aws_internet_gateway.igw[0].id
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-public-rt"
    }
  )
  depends_on = [aws_vpc.this, aws_internet_gateway.igw]
}

resource "aws_route_table_association" "public-rt-association" {
  # Create associations only if an Internet Gateway is enabled and there are public subnets.
  # Iterate over the actual created public subnet resources.
  for_each       = var.enable_internet_gateway && length(aws_subnet.public) > 0 ? aws_subnet.public : {}
  subnet_id      = each.value.id # each.value here refers to an aws_subnet.public resource
  # Access the first (and only) element of the list when count is 1
  route_table_id = aws_route_table.public-rt[0].id
}

resource "aws_route_table" "private-rt" {
  vpc_id = aws_vpc.this.id

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-private-rt"
    }
  )

}
# Associate the private subnets with the private route table
resource "aws_route_table_association" "private-rt-association" {
  # Iterate over the actual created private subnet resources if any exist
  for_each       = length(var.private_subnets) > 0 ? aws_subnet.private : {}
  subnet_id      = each.value.id
  route_table_id = aws_route_table.private-rt.id
}
