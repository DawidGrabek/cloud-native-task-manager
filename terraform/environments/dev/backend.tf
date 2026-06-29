# =============================================================================
# TERRAFORM BACKEND CONFIGURATION
# Remote state stored in S3 — enables team collaboration and state persistence
# between sessions (even after terraform destroy, state survives in S3).
#
# IMPORTANT: Run terraform/backend-bootstrap first to create these resources.
# Then replace bucket/dynamodb_table values with the outputs from bootstrap.
# =============================================================================

terraform {
  backend "s3" {
    # ⚠️  Replace with output from: cd terraform/backend-bootstrap && terraform output
    bucket         = "REPLACE_WITH_BOOTSTRAP_OUTPUT"
    key            = "environments/dev/terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "taskmanager-tfstate-lock"
    encrypt        = true
  }
}
