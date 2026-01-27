terraform {
  backend "s3" {
    bucket       = "terraform-state-aws-projects-dev"
    key          = "networking/network-design/vpc-design/state/terraform.tfstate"
    region       = "eu-central-1"
    use_lockfile = true
  }


}
