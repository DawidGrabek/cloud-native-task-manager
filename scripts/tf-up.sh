#!/usr/bin/env bash
# =============================================================================
# tf-up.sh — Start a working session
# Run this at the beginning of every session to bring up the AWS infrastructure.
#
# Usage: ./scripts/tf-up.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="${SCRIPT_DIR}/../terraform/environments/dev"
REGION="eu-central-1"

echo "🚀 Starting TaskManager infrastructure..."
echo ""

# ── Step 1: Apply Terraform ──────────────────────────────────────────────────
echo "📦 Running terraform apply..."
cd "${TF_DIR}"
terraform init -upgrade -reconfigure
terraform apply -auto-approve

echo ""
echo "✅ Infrastructure ready!"
echo ""

# ── Step 2: Show key outputs ─────────────────────────────────────────────────
echo "📋 Key outputs:"
terraform output

# ── Step 3: Configure kubectl (only after EKS exists — Sesja 2+) ─────────────
CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "")

if aws eks describe-cluster --name "${CLUSTER_NAME}" --region "${REGION}" &>/dev/null; then
  echo ""
  echo "🔗 Configuring kubectl for EKS cluster: ${CLUSTER_NAME}..."
  aws eks update-kubeconfig \
    --name "${CLUSTER_NAME}" \
    --region "${REGION}" \
    --alias "${CLUSTER_NAME}"

  echo ""
  echo "🎯 kubectl context set. Test with: kubectl get nodes"
else
  echo ""
  echo "ℹ️  EKS cluster not yet created (expected in Sesja 2). Skipping kubectl config."
fi

echo ""
echo "════════════════════════════════════════"
echo "  Session started. Happy coding! 🏗️"
echo "  Remember to run ./scripts/tf-down.sh when done!"
echo "════════════════════════════════════════"
