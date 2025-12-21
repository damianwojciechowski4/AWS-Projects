resource "aws_vpc" "vpc-prod" {
  cidr_block = "10.200.0.0/16"
}



resource "aws_subnet" "public-subnet-1a" {
  vpc_id     = aws_vpc.vpc-prod.id
  cidr_block = "10.200.1.0/24"
  tags = {
    "Name" = "public-subnet-1a"
  }

}

resource "aws_subnet" "private-subnet-1a" {
  vpc_id     = aws_vpc.vpc-prod.id
  cidr_block = "10.200.101.0/24"
  tags = {
    "Name" = "private-subnet-1a"
  }
}

resource "aws_route_table" "main-rt" {
  vpc_id = aws_vpc.vpc-prod.id
}


resource "aws_route_table_association" "assoc-public-1a" {
  subnet_id      = aws_subnet.public-subnet-1a.id
  route_table_id = aws_route_table.main-rt.id
}



output "rt-main-id" {
  value = aws_route_table.main-rt.id
}

output "vpc-id" {
  value = aws_vpc.vpc-prod.id
}

output "public-subnet-1a-id" {
  value = aws_subnet.public-subnet-1a.id
}

output "private-subnet-1a-id" {
  value = aws_subnet.private-subnet-1a.id
}