
resource "aws_dynamodb_table" "ec2-scheduler-table" {
  name         = var.aws_dynamoDB_tableName
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ID"

  attribute {
    name = "ID"
    type = "N"
  }
    tags = {
    Terraform = "True"
    Name      = var.aws_dynamoDB_tableName
  }
}
resource "aws_dynamodb_table_item" "example" {
  table_name = aws_dynamodb_table.ec2-scheduler-table.name
  hash_key   = aws_dynamodb_table.ec2-scheduler-table.hash_key
  for_each = {
    "1" = {
      schedulerName = "dev"
      start_time = "9:00:00"
      stop_time = "17:00:00"
      weekdays = "mon-fri"

    }
    "2" = {
      schedulerName = "dev-schedule"
      start_time = "9:00:00"
      stop_time = "17:00:00"
      weekdays = "mon-thu"
    }
  }
  item = <<ITEM
    {
        "${aws_dynamodb_table.ec2-scheduler-table.hash_key}":{"N":"${each.key}"},
        "schedulerName": {"S": "${each.value.schedulerName}"},
        "start_time": {"S": "${each.value.start_time}"},
        "stop_time": {"S": "${each.value.stop_time}"},
        "weekdays": {"S": "${each.value.weekdays}"}
    }
    ITEM
}

