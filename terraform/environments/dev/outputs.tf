output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs (for ALB)"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs (for EKS nodes)"
  value       = module.vpc.private_subnet_ids
}

output "ecr_repository_urls" {
  description = "ECR repository URLs — copy backend/frontend values to CI secrets"
  value       = module.ecr.repository_urls
}

output "github_actions_role_arn" {
  description = "⭐ Add this as GitHub secret: AWS_ROLE_ARN"
  value       = module.iam.github_actions_role_arn
}

output "eks_cluster_role_arn" {
  description = "EKS cluster IAM role ARN (needed in Sesja 2)"
  value       = module.iam.eks_cluster_role_arn
}

output "eks_node_role_arn" {
  description = "EKS node IAM role ARN (needed in Sesja 2)"
  value       = module.iam.eks_node_role_arn
}

output "karpenter_controller_role_arn" {
  description = "Karpenter controller IRSA role ARN (needed in Sesja 2)"
  value       = module.iam.karpenter_controller_role_arn
}

output "aws_lbc_role_arn" {
  description = "AWS LBC IRSA role ARN (needed in Sesja 2)"
  value       = module.iam.aws_lbc_role_arn
}

output "external_secrets_role_arn" {
  description = "External Secrets Operator IRSA role ARN (needed in Sesja 2)"
  value       = module.iam.external_secrets_role_arn
}

output "db_password_secret_name" {
  description = "AWS Secrets Manager secret name for DB password"
  value       = module.secrets.db_password_secret_name
}

output "cluster_name" {
  description = "EKS cluster name (to be created in Sesja 2)"
  value       = local.cluster_name
}
