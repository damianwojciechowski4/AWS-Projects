
##########################################
##################  IAM ##################
##########################################
resource "aws_iam_policy" "scheduler_policy" {
  name        = "scheduler_policy"
  path        = "/"
  description = "Policy to allow Scheduler to run Lambda Function"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "lambda:InvokeFunction"
        ],
        Resource = "arn:aws:lambda:*"

      },
    ]
  })
}
resource "aws_iam_role" "scheduler" {
  name = "ec2_scheduler_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "scheduler.amazonaws.com",
        }
        Action = "sts:AssumeRole",
      }
    ]
  })
}
resource "aws_iam_role_policy_attachment" "scheduler" {
  policy_arn = aws_iam_policy.scheduler_policy.arn
  role       = aws_iam_role.scheduler.name
}

##########################################
###############  Scheduler ###############
##########################################
resource "aws_scheduler_schedule" "scheduler" {
  name       = var.EventBridge_ScheduleName
  group_name = "default"
  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "cron(0 * ? * * *)"
  target {
    arn      = aws_lambda_function.example.arn
    role_arn = aws_iam_role.scheduler.arn
  }
}


