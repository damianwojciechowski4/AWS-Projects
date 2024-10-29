output "eventBridge_schedule-arn" {
  value = aws_scheduler_schedule.scheduler.arn
}
output "lambda_function_arn" {
  value = aws_lambda_function.example.arn 
}
output "dynamoDB_arn" {
    value = aws_dynamodb_table.ec2-scheduler-table.arn
}
