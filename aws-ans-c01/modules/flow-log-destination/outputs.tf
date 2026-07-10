output "cloudwatch_log_group_arn" {
  description = "CloudWatch Log Group ARN (null when destination_type = s3). Feed into vpc module's flow_log_cloudwatch_log_group_arn."
  value       = local.is_cloudwatch ? aws_cloudwatch_log_group.this[0].arn : null
}

output "iam_role_arn" {
  description = "IAM role ARN the VPC Flow Logs service assumes to write to CloudWatch (null when destination_type = s3). Feed into vpc module's flow_log_iam_role_arn."
  value       = local.is_cloudwatch ? aws_iam_role.cloudwatch_delivery[0].arn : null
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN (null when destination_type = cloud-watch-logs). Feed into vpc module's flow_log_s3_bucket_arn."
  value       = local.is_s3 ? aws_s3_bucket.this[0].arn : null
}
