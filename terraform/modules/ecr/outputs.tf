output "repository_urls" {
  description = "Map of repo name → ECR URL (e.g. {backend: '123.dkr.ecr...'})"
  value       = { for name, repo in aws_ecr_repository.app : name => repo.repository_url }
}

output "registry_id" {
  description = "ECR registry ID (= AWS account ID)"
  value       = values(aws_ecr_repository.app)[0].registry_id
}
