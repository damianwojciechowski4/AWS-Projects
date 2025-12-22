variable "aws_region" {
    description = "AWS region"
    type = string
}

variable "environment" {
    description = "Environment name"
    type = string
}

variable "vpc_cidr" {
    description = "VPC CIDR"
    type = string
}

variable "public_subnets" {
    description = "Map of public subnet CIDRs keyed by AZ"
    type = map(string)
}


variable "private_subnets" {
    description = "Map of private subnet CIDRs keyed by AZ"
    type = map(string)
}