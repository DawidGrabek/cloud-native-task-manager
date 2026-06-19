variable "project" {
  description = "Project name prefix"
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository in format 'owner/repo' — used to scope OIDC trust"
  type        = string
  # Example: "DawidGrabek/cloud-native-task-manager"
}

variable "eks_oidc_provider_arn" {
  description = "ARN of the EKS OIDC provider (for IRSA). Empty string on first apply (before EKS exists)."
  type        = string
  default     = ""
}

variable "eks_oidc_provider" {
  description = "URL of the EKS OIDC provider without https:// (for IRSA conditions)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
