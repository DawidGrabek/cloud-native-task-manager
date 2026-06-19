#!/usr/bin/env bash
# =============================================================================
# tf-down.sh — End a working session
# Destroys ALL AWS resources to stop billing. Safe to run at any time.
#
# What is PRESERVED (survives between sessions):
#   - S3 bucket with Terraform state (created by backend-bootstrap)
#   - DynamoDB lock table
#   - ECR images (stored in ECR, not destroyed by terraform destroy)
#
# What is DESTROYED (recreated next session with tf-up.sh):
#   - EKS cluster, nodes, all k8s workloads
#   - VPC, subnets, NAT Gateway, ALB
#   - RDS, ElastiCache (if added)
#   - Secrets Manager secrets
#   - IAM roles (recreated quickly)
#
# Usage: ./scripts/tf-down.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="${SCRIPT_DIR}/../terraform/environments/dev"

echo "🛑 Destroying TaskManager infrastructure..."
echo "   This will stop all AWS billing (except S3 state ~\$0.01/month)."
echo ""
read -r -p "Are you sure? Type 'yes' to confirm: " confirm

if [[ "${confirm}" != "yes" ]]; then
  echo "Aborted."
  exit 0
fi

cd "${TF_DIR}"
terraform destroy -auto-approve

echo ""
echo "✅ Infrastructure destroyed. Credits are safe! 💰"
echo ""
echo "📝 Note: ECR images are still stored (costs pennies)."
echo "   To also delete ECR images: aws ecr batch-delete-image ..."
echo ""
echo "   Next session: ./scripts/tf-up.sh"
