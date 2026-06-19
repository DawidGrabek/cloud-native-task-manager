variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "taskmanager"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "Availability zones (2 for cost/HA balance)"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "github_repo" {
  description = "GitHub repository 'owner/repo' for OIDC trust policy"
  type        = string
  default     = "DawidGrabek/cloud-native-task-manager"
}

# ─── POPULATED IN SESJA 2 (after EKS is created) ─────────────────────────────

variable "eks_oidc_provider_arn" {
  description = "EKS OIDC provider ARN (set after EKS cluster is created in Sesja 2)"
  type        = string
  default     = ""
}

variable "eks_oidc_provider" {
  description = "EKS OIDC provider URL without https:// (set after EKS cluster is created)"
  type        = string
  default     = ""
}
