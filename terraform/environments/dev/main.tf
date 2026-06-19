# =============================================================================
# DEV ENVIRONMENT — Root Module
# Wires together all modules for the dev environment.
# Sesja 1: vpc + iam + ecr + secrets (EKS added in Sesja 2)
# =============================================================================

terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ─── VPC ─────────────────────────────────────────────────────────────────────

module "vpc" {
  source = "../../modules/vpc"

  project      = var.project
  cluster_name = local.cluster_name
  vpc_cidr     = var.vpc_cidr
  azs          = var.azs
  tags         = local.common_tags
}

# ─── IAM ─────────────────────────────────────────────────────────────────────
# Note: eks_oidc_provider_arn and eks_oidc_provider are empty on first apply.
# They will be populated in Sesja 2 after EKS cluster is created.

module "iam" {
  source = "../../modules/iam"

  project               = var.project
  cluster_name          = local.cluster_name
  github_repo           = var.github_repo
  eks_oidc_provider_arn = var.eks_oidc_provider_arn
  eks_oidc_provider     = var.eks_oidc_provider
  tags                  = local.common_tags
}

# ─── ECR ─────────────────────────────────────────────────────────────────────

module "ecr" {
  source = "../../modules/ecr"

  project         = var.project
  max_image_count = 10
  tags            = local.common_tags
}

# ─── SECRETS ─────────────────────────────────────────────────────────────────

module "secrets" {
  source = "../../modules/secrets"

  project     = var.project
  environment = var.environment
  tags        = local.common_tags
}
