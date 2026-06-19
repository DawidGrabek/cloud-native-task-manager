output "eks_cluster_role_arn" {
  description = "ARN of the EKS cluster IAM role"
  value       = aws_iam_role.eks_cluster.arn
}

output "eks_node_role_arn" {
  description = "ARN of the EKS node IAM role"
  value       = aws_iam_role.eks_node.arn
}

output "eks_node_role_name" {
  description = "Name of the EKS node IAM role (used by Karpenter instance profile)"
  value       = aws_iam_role.eks_node.name
}

output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions OIDC role — add this as GH secret: AWS_ROLE_ARN"
  value       = aws_iam_role.github_actions.arn
}

output "aws_lbc_role_arn" {
  description = "ARN of the AWS Load Balancer Controller IRSA role"
  value       = aws_iam_role.aws_lbc.arn
}

output "external_secrets_role_arn" {
  description = "ARN of the External Secrets Operator IRSA role"
  value       = aws_iam_role.external_secrets.arn
}

output "karpenter_controller_role_arn" {
  description = "ARN of the Karpenter controller IRSA role"
  value       = aws_iam_role.karpenter_controller.arn
}

output "karpenter_node_instance_profile_name" {
  description = "Name of the instance profile for Karpenter-launched nodes"
  value       = aws_iam_instance_profile.karpenter_node.name
}
