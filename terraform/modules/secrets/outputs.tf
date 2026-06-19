output "db_password_secret_arn" {
  description = "ARN of the DB password secret (referenced by External Secrets Operator)"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

output "jwt_secret_arn" {
  description = "ARN of the JWT secret"
  value       = aws_secretsmanager_secret.jwt_secret.arn
  sensitive   = true
}

output "db_password_secret_name" {
  description = "Name of the DB password secret"
  value       = aws_secretsmanager_secret.db_password.name
}

output "jwt_secret_name" {
  description = "Name of the JWT secret"
  value       = aws_secretsmanager_secret.jwt_secret.name
}
