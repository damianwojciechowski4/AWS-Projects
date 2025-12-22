aws_region  = "eu-central-1"
environment = "prod"
name        = "myVPC"

vpc_cidr = "10.200.0.0/16"



public_subnets = {
  "eu-central-1a" = "10.200.1.0/24"
}

private_subnets = {
  "eu-central-1a" = "10.200.101.0/24"
}