
variable "aws_region" {
  description = "Choosed AWS region to deploy infrastructure and backend"
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Name of your environment"
  type    = string
  default = "dev"
}

variable "EventBridge_ScheduleName" {
  description = "Name of EventBridge Scheduler"
  type = string
  default = "checkEC2HourlyState-schedule"
}

variable "aws_dynamoDB_tableName" {
    description = "Name of DynamoDB table"
    type = string
    default = "ec2-scheduler-table"
}

variable "lambda_function_name" {
  description = "Name of Lambda Function"
  type = string
  default = "EC2SchedulerLambda"
}
