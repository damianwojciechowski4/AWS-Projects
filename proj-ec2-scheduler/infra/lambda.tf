##########################################
##################  IAM ##################
##########################################
//creation of IAM role for lambda dunction
data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "iam_for_lambda" {
  name               = "iam_for_lambda"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

//create EC2 permissions policy
data "aws_iam_policy_document" "AmazonEC2RWLimitedAccess" {
  statement {
    effect = "Allow"
    actions = ["ec2:DescribeInstances",
              "ec2:StartInstances",
              "ec2:StopInstances"]
    resources = ["*"]
  }
}
resource "aws_iam_policy" "policy_AmazonEC2RWLimitedAccess" {
  name        = "AmazonEC2RWLimitedAccess"
  description = "This policy can be used to Describe and Start/Stop EC2 instances"
  policy      = data.aws_iam_policy_document.AmazonEC2RWLimitedAccess.json
}

//create dynamoDB permissions policy
data "aws_iam_policy_document" "AmazonDynamoDBScan" {
  statement {
    effect    = "Allow"
    actions   = ["dynamodb:Scan"]
    resources = ["*"]
  }
}
resource "aws_iam_policy" "policy_AmazonDynamoDBScan" {
  name        = "AmazonDynamoDBScan"
  description = "This policy can be used to allow access to scan DynamoDB table"
  policy      = data.aws_iam_policy_document.AmazonDynamoDBScan.json
}

//create CloudWatch Log group permissions
data "aws_iam_policy_document" "CloudWatchLogGroupCreate_Put" {
  statement {
    effect = "Allow"
    actions = ["logs:CreateLogGroup",
      "logs:CreateLogStream",
    "logs:PutLogEvents"]
    resources = ["*"]
  }
}
resource "aws_iam_policy" "policy_CloudWatchLogGroupCreate_Put" {
  name        = "CloudWatchLogGroupCreate_Put"
  description = "This policy can be used to allow Lambda to log event logs to CloudWatch Log group"
  policy      = data.aws_iam_policy_document.CloudWatchLogGroupCreate_Put.json
}

//attach EC2 policy
resource "aws_iam_role_policy_attachment" "lambda_policy_ec2" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = aws_iam_policy.policy_AmazonEC2RWLimitedAccess.arn
}
//attach dynamoDB policy
resource "aws_iam_role_policy_attachment" "lambda_policy_dynamodb" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = aws_iam_policy.policy_AmazonDynamoDBScan.arn
}
//attach cloudwatch policy
resource "aws_iam_role_policy_attachment" "lambda_policy_cloudwatch" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = aws_iam_policy.policy_CloudWatchLogGroupCreate_Put.arn
}
//archive lambda code
data "archive_file" "lambda_function_archive" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda_code/"
  output_path = "${path.module}/../lambda_code/archive/ec2-start-stop-lambda.zip"
}


//create Lambda function
resource "aws_lambda_function" "example" {
  filename      = "${path.module}/../lambda_code/archive/ec2-start-stop-lambda.zip"
  function_name = var.lambda_function_name
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "ec2-start-stop-lambda.lambda_handler"
  runtime       = "python3.10"

  environment {
    variables = {
      dynamoDB_tableName = var.aws_dynamoDB_tableName
    }
  }
  tags = {
    Terraform = "True"
    Name      = var.lambda_function_name
  }
}

