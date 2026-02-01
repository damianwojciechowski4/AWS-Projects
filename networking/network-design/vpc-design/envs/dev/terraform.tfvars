aws_region  = "eu-central-1"
environment = "dev"

vpc_configs = {
  "spoke_a" = {
    cidr            = "10.1.0.0/16"
    public_subnets  = { "eu-central-1a" = "10.1.1.0/24", "eu-central-1b" = "10.1.2.0/24" }
    private_subnets = { "eu-central-1a" = "10.1.101.0/24", "eu-central-1b" = "10.1.102.0/24" }
  }
  "spoke_b" = {
    cidr            = "10.2.0.0/16"
    public_subnets  = { "eu-central-1a" = "10.2.1.0/24", "eu-central-1b" = "10.2.2.0/24" }
    private_subnets = { "eu-central-1a" = "10.2.101.0/24", "eu-central-1b" = "10.2.102.0/24" }
  }
  "hub_inspection" = {
    cidr            = "10.0.0.0/16"
    public_subnets  = { "eu-central-1a" = "10.0.1.0/24", "eu-central-1b" = "10.0.2.0/24" }
    private_subnets = { "eu-central-1a" = "10.0.101.0/24", "eu-central-1b" = "10.0.102.0/24" }
  }

}