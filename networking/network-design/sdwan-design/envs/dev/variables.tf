variable "region" {
  type        = string
  description = "AWS region to deploy into."
}

variable "environment" {
  type        = string
  description = "Environment name (dev, prod, staging)."
}

variable "tags" {
  type        = map(string)
  description = "Tags applied to all resources."
}
