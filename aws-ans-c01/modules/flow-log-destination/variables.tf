variable "name" {
  description = "Name prefix used for the log group / bucket and related resource tags"
  type        = string
}

variable "destination_type" {
  description = "Where flow logs are delivered: cloud-watch-logs or s3"
  type        = string

  validation {
    condition     = contains(["cloud-watch-logs", "s3"], var.destination_type)
    error_message = "destination_type must be 'cloud-watch-logs' or 's3'."
  }
}

variable "retention_days" {
  description = "CloudWatch Logs retention in days. Ignored when destination_type = s3."
  type        = number
  default     = 90
}

variable "kms_key_arn" {
  description = "Optional KMS key ARN to encrypt the log group or bucket at rest. Null uses the AWS-managed default encryption."
  type        = string
  default     = null
}

variable "tags" {
  description = "Additional tags merged onto all resources"
  type        = map(string)
  default     = {}
}
