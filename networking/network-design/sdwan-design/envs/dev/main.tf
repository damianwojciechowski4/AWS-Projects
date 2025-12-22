resource "aws_s3_bucket" "example" {
  bucket = "my-test-bucket-${random_id.suffix.hex}"
  tags = {
    Name        = "test-bucket-terraform-CICD-pipeline"
    Environment = "PROD"
    IaC = "Terraform"
  }
}

resource "random_id" "suffix" {
  byte_length = 4
}

output "bucket_name" {
  description = "S3 bucket name."
  value       = aws_s3_bucket.example.id
}