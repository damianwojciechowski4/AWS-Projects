
variable "aws_region" {
  description = "Choosed AWS region to deploy infrastructure and backend"
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "EventBridge_ScheduleName" {
  type = string
  default = "checkEC2HourlyState-schedule"
}

variable "aws_dynamoDB_tableName" {
    type = string
    default = "ec2-scheduler-table"
}

variable "lambda_function_name" {
  default = "EC2SchedulerLambda"
}