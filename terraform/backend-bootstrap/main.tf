# =============================================================================
# BOOTSTRAP — Run ONCE manually before anything else.
# Creates S3 bucket (Terraform remote state) and DynamoDB table (state locking).
# These resources are intentionally NOT managed by themselves to avoid bootstrap paradox.
#
# Usage:
#   cd terraform/backend-bootstrap
#   terraform init
#   terraform apply
# =============================================================================

terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Random suffix ensures globally unique S3 bucket name
resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  bucket_name = "taskmanager-tfstate-${random_id.suffix.hex}"
  table_name  = "taskmanager-tfstate-lock"
}

# S3 bucket for Terraform state
resource "aws_s3_bucket" "terraform_state" {
  bucket = local.bucket_name

  # Prevent accidental deletion of state
  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name    = "Terraform State"
    Project = "taskmanager"
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_state_lock" {
  name         = local.table_name
  billing_mode = "PAY_PER_REQUEST" # no idle cost
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name    = "Terraform State Lock"
    Project = "taskmanager"
  }
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.terraform_state.bucket
  description = "Copy this into terraform/environments/dev/backend.tf"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.terraform_state_lock.name
  description = "Copy this into terraform/environments/dev/backend.tf"
}
