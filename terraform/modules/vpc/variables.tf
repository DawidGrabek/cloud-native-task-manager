variable "project" {
  description = "Project name prefix for all resources"
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name (used for subnet tags required by AWS LBC and Karpenter)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "Availability zones to use (2 recommended for cost/HA balance)"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default     = {}
}
