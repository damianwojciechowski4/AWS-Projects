terraform {
  backend "s3" {
    bucket = "terraform-state-aws-projects-network"
    key    = "networking/network-design/sdwan-design/prod.tfstate"
    region = "eu-central-1"
  }
}