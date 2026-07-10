# aws-ans-c01/modules/flow-log-destination/main.tf

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  is_cloudwatch = var.destination_type == "cloud-watch-logs"
  is_s3         = var.destination_type == "s3"
}

# ── CloudWatch Logs destination ────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "this" {
  count = local.is_cloudwatch ? 1 : 0

  name              = "/vpc/${var.name}/flow-logs"
  retention_in_days = var.retention_days
  kms_key_id        = var.kms_key_arn

  tags = var.tags
}

# Trust policy: only the VPC Flow Logs service may assume this role.
data "aws_iam_policy_document" "cloudwatch_assume_role" {
  count = local.is_cloudwatch ? 1 : 0

  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
  }
}

# Permissions policy: scoped to this log group only, not logs:* everywhere.
data "aws_iam_policy_document" "cloudwatch_delivery" {
  count = local.is_cloudwatch ? 1 : 0

  statement {
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
    ]
    resources = ["${aws_cloudwatch_log_group.this[0].arn}:*"]
  }
}

resource "aws_iam_role" "cloudwatch_delivery" {
  count = local.is_cloudwatch ? 1 : 0

  name               = "${var.name}-flow-log-delivery"
  assume_role_policy = data.aws_iam_policy_document.cloudwatch_assume_role[0].json

  tags = var.tags
}

resource "aws_iam_role_policy" "cloudwatch_delivery" {
  count = local.is_cloudwatch ? 1 : 0

  name   = "${var.name}-flow-log-delivery"
  role   = aws_iam_role.cloudwatch_delivery[0].id
  policy = data.aws_iam_policy_document.cloudwatch_delivery[0].json
}

# ── S3 destination ──────────────────────────────────────────────────────────────

resource "aws_s3_bucket" "this" {
  count = local.is_s3 ? 1 : 0

  bucket = "${var.name}-flow-logs"
  tags   = var.tags
}

resource "aws_s3_bucket_public_access_block" "this" {
  count = local.is_s3 ? 1 : 0

  bucket                  = aws_s3_bucket.this[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  count = local.is_s3 ? 1 : 0

  bucket = aws_s3_bucket.this[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.kms_key_arn != null ? "aws:kms" : "AES256"
      kms_master_key_id = var.kms_key_arn
    }
  }
}

# Two statements AWS requires for flow log delivery to S3:
# AWSLogDeliveryAclCheck lets the service verify bucket ownership/ACL before
# writing; AWSLogDeliveryWrite is the actual PutObject, scoped to this
# account's flow logs and this bucket's prefix via aws:SourceAccount/SourceArn.
data "aws_iam_policy_document" "s3_delivery" {
  count = local.is_s3 ? 1 : 0

  statement {
    sid    = "AWSLogDeliveryAclCheck"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["delivery.logs.amazonaws.com"]
    }
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.this[0].arn]

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }

  statement {
    sid    = "AWSLogDeliveryWrite"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["delivery.logs.amazonaws.com"]
    }
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.this[0].arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

resource "aws_s3_bucket_policy" "this" {
  count = local.is_s3 ? 1 : 0

  bucket = aws_s3_bucket.this[0].id
  policy = data.aws_iam_policy_document.s3_delivery[0].json
}
