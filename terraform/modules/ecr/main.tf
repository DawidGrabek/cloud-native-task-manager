# =============================================================================
# ECR MODULE
# Creates container registries for backend and frontend images.
#
# Concepts: Image lifecycle management, supply chain security (scan on push)
# =============================================================================

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }
}

locals {
  repos = ["backend", "frontend"]
}

resource "aws_ecr_repository" "app" {
  for_each = toset(local.repos)

  name                 = "${var.project}/${each.key}"
  image_tag_mutability = "MUTABLE" # allows 'latest' tag to be overwritten

  # Supply chain security: automatically scan every pushed image for CVEs
  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(var.tags, { Name = "${var.project}-${each.key}" })
}

# Lifecycle policy: keep last N images to control storage costs
# Old images from feature branches don't accumulate forever
resource "aws_ecr_lifecycle_policy" "app" {
  for_each   = aws_ecr_repository.app
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.max_image_count} images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = var.max_image_count
        }
        action = { type = "expire" }
      }
    ]
  })
}
