aws_region  = "eu-central-1"
environment = "dev"
name        = "DEV-VPC-Core"

vpc_cidr = "10.200.0.0/16"



public_subnets = {
  "eu-central-1a" = "10.200.1.0/24",
  "eu-central-1b" = "10.200.2.0/24",

}

private_subnets = {
  "eu-central-1a" = "10.200.101.0/24",
  "eu-central-1b" = "10.200.102.0/24",

}

