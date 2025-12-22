terraform {
  backend "s3" {
    bucket       = "terraform-state-aws-projects-network"
    key          = "networking/network-design/vpc-design/state/terraform.tfstate"
    region       = "eu-central-1"
    use_lockfile = true
  }


}
