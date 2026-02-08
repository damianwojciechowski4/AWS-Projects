locals {
  common_tags = {
    #Organization and Ownership
    Project     = "network-design/vpc-design"
    Environment = var.environment
    Owner       = "DW"

    # Technical Metadata
    Terraform      = true
    RepositoryPath = "networking/network-design/vpc-design"

    # Operations & Security
    CostCenter = "CC-123456"
    ManagedBy  = "Terraform"


  }
}
