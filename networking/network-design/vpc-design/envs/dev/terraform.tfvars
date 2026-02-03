aws_region  = "eu-central-1"
environment = "dev"

spoke_vpc_configs = {
  "spoke_a" = {
    cidr            = "10.1.0.0/16"
    public_subnets  = { } # no public subnets for spoke_a
    private_subnets = { "eu-central-1a" = "10.1.101.0/24", "eu-central-1b" = "10.1.102.0/24" }
  }
  "spoke_b" = {
    cidr            = "10.2.0.0/16"
    public_subnets  = { } # no public subnets for spoke_b
    private_subnets = { "eu-central-1a" = "10.2.101.0/24", "eu-central-1b" = "10.2.102.0/24" }
  }

}

inspection_vpc_configs = {
  "inspection" = {
    cidr            = "10.0.0.0/16" # Example CIDR for your inspection VPC
    public_subnets  = { "eu-central-1a" = "10.0.1.0/24" } # Example public subnet
    private_subnets = { "eu-central-1a" = "10.0.101.0/24" } # Example private subnet
  }
}