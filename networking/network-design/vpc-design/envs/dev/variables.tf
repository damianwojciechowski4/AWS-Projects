variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "spoke_vpc_configs" {
  description = "Map of VPC configurations for spoke_a, spoke_b and hub"
  type = map(object({
    cidr            = string
    public_subnets  = map(string)
    private_subnets = map(string)
  }))
}


variable "inspection_vpc_configs" {
  description = "Map of VPC configurations for inspection VPC"
  type = map(object({
    cidr            = string
    public_subnets  = map(string)
    private_subnets = map(string)
  }))
}

