terraform {
  backend "s3" {
    bucket = "terraform-state-aws-projects-network"
    key    = "networking/network-design/sdwan-design/dev.tfstate"
    region = var.region
  }
}