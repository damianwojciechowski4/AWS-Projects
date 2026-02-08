variable "security_groups" {
  description = "Security groups definition"
  type = map(object({
    description = optional(string, "Dynamic Security group")
    ingress_rules = optional(list(object({
      from_port   = number
      to_port     = number
      protocol    = string
      cidr_blocks = list(string)
    })), [])
    egress_rules = optional(list(object({
      from_port   = number
      to_port     = number
      protocol    = string
      cidr_blocks = list(string)
    })), [])
  }))
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC where to create the security groups"
  type        = string
}
