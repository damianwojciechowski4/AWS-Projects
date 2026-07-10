module "flow_log_destination" {
  source = "../../modules/flow-log-destination"

  name             = "a4l-vpc1"
  destination_type = "cloud-watch-logs" #or "s3"
  retention_days   = 90

  tags = {
    Environment = "general"
    Project     = "aws-ans-c01"
  }
}

module "vpc" {
  source = "../../modules/vpc"

  name     = "a4l-vpc1"
  vpc_cidr = "10.16.0.0/16"

  subnets = {
    "sn-reserved-A" = { cidr = "10.16.0.0/20",   az = "us-east-1a" }
    "sn-db-A"       = { cidr = "10.16.16.0/20",  az = "us-east-1a" }
    "sn-app-A"      = { cidr = "10.16.32.0/20",  az = "us-east-1a" }
    "sn-web-A"      = { cidr = "10.16.48.0/20",  az = "us-east-1a" }

    "sn-reserved-B" = { cidr = "10.16.64.0/20",  az = "us-east-1b" }
    "sn-db-B"       = { cidr = "10.16.80.0/20",  az = "us-east-1b" }
    "sn-app-B"      = { cidr = "10.16.96.0/20",  az = "us-east-1b" }
    "sn-web-B"      = { cidr = "10.16.112.0/20", az = "us-east-1b" }

    "sn-reserved-C" = { cidr = "10.16.128.0/20", az = "us-east-1c" }
    "sn-db-C"       = { cidr = "10.16.144.0/20", az = "us-east-1c" }
    "sn-app-C"      = { cidr = "10.16.160.0/20", az = "us-east-1c" }
    "sn-web-C"      = { cidr = "10.16.176.0/20", az = "us-east-1c" }
  }

  enable_igw              = true
  enable_nat_gateway      = false
  nat_gateway_mode        = "regional"
  enable_ipv6             = true
  map_public_ip_on_launch = false

  enable_flow_logs                  = true
  flow_log_destination_type         = "cloud-watch-logs" #or "s3"
  flow_log_traffic_type             = "ALL"
  #or flow_log_s3_bucket_arn = module.flow_log_destination.s3_bucket_arn
  flow_log_cloudwatch_log_group_arn = module.flow_log_destination.cloudwatch_log_group_arn 
  flow_log_iam_role_arn             = module.flow_log_destination.iam_role_arn

  tags = {
    Environment = "general"
    Project     = "aws-ans-c01"
  }
}
