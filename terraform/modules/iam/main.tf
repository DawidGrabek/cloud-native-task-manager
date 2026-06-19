# =============================================================================
# IAM MODULE
# Creates all IAM roles following the principle of least privilege.
#
# Key concepts covered:
# - IRSA (IAM Roles for Service Accounts): pods get AWS permissions without
#   static keys — credentials are injected via OIDC token exchange
# - OIDC for GitHub Actions: CI/CD authenticates to AWS without any
#   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY stored in GitHub secrets
# - Least privilege: each role has only the permissions it actually needs
# =============================================================================

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
}

# ─── EKS CLUSTER ROLE ────────────────────────────────────────────────────────
# The control plane assumes this role to manage AWS resources on your behalf

resource "aws_iam_role" "eks_cluster" {
  name = "${var.project}-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

# ─── EKS NODE ROLE ───────────────────────────────────────────────────────────
# EC2 instances (nodes) assume this role to join the cluster and pull images

resource "aws_iam_role" "eks_node" {
  name = "${var.project}-eks-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "eks_worker_node" {
  role       = aws_iam_role.eks_node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "eks_cni" {
  role       = aws_iam_role.eks_node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "eks_ecr_read" {
  role       = aws_iam_role.eks_node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# EBS CSI driver needs this to create/attach EBS volumes for PVCs
resource "aws_iam_role_policy_attachment" "eks_ebs_csi" {
  role       = aws_iam_role.eks_node.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
}

# ─── GITHUB ACTIONS OIDC ROLE ────────────────────────────────────────────────
# Concept: Federated Identity / Workload Identity Federation
#
# Instead of storing long-lived AWS keys in GitHub secrets, GitHub Actions
# exchanges a short-lived OIDC token for temporary AWS credentials.
# The trust policy limits this to ONLY your specific repository.

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  # GitHub's OIDC thumbprint (stable, rarely changes)
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1", "1c58a3a8518e8759bf075b76b750d4f2df264fcd"]

  tags = var.tags
}

resource "aws_iam_role" "github_actions" {
  name = "${var.project}-github-actions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          # Only allow from YOUR specific repo (security boundary)
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:*"
        }
      }
    }]
  })

  tags = var.tags
}

# Permissions for GitHub Actions:
# - Push images to ECR
# - Read EKS kubeconfig (ArgoCD handles actual deploys, not GH Actions)
# - Read secrets for any initialization tasks
resource "aws_iam_role_policy" "github_actions" {
  name = "${var.project}-github-actions-policy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # ECR authentication
        Effect   = "Allow"
        Action   = "ecr:GetAuthorizationToken"
        Resource = "*"
      },
      {
        # ECR image push (to our specific repos only)
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
        ]
        Resource = [
          "arn:aws:ecr:${local.region}:${local.account_id}:repository/${var.project}/*"
        ]
      },
      {
        # EKS — only describe cluster (ArgoCD connects via in-cluster, not CI)
        Effect   = "Allow"
        Action   = ["eks:DescribeCluster"]
        Resource = "arn:aws:eks:${local.region}:${local.account_id}:cluster/${var.cluster_name}"
      }
    ]
  })
}

# ─── IRSA: AWS LOAD BALANCER CONTROLLER ──────────────────────────────────────
# Allows the LBC pod to create/manage ALBs when an Ingress resource is created

resource "aws_iam_role" "aws_lbc" {
  name = "${var.project}-aws-lbc-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.eks_oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${var.eks_oidc_provider}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
          "${var.eks_oidc_provider}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = var.tags
}

# AWS provides a managed policy for the LBC — use it to avoid drift
resource "aws_iam_policy" "aws_lbc" {
  name   = "${var.project}-aws-lbc-policy"
  policy = file("${path.module}/policies/aws-lbc-policy.json")
}

resource "aws_iam_role_policy_attachment" "aws_lbc" {
  role       = aws_iam_role.aws_lbc.name
  policy_arn = aws_iam_policy.aws_lbc.arn
}

# ─── IRSA: EXTERNAL SECRETS OPERATOR ─────────────────────────────────────────
# Allows ESO to read secrets from AWS Secrets Manager

resource "aws_iam_role" "external_secrets" {
  name = "${var.project}-external-secrets-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.eks_oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${var.eks_oidc_provider}:sub" = "system:serviceaccount:external-secrets:external-secrets"
          "${var.eks_oidc_provider}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "external_secrets" {
  name = "${var.project}-external-secrets-policy"
  role = aws_iam_role.external_secrets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
      ]
      # Scoped to only secrets with our project prefix
      Resource = "arn:aws:secretsmanager:${local.region}:${local.account_id}:secret:${var.project}/*"
    }]
  })
}

# ─── IRSA: KARPENTER ─────────────────────────────────────────────────────────
# Allows Karpenter controller to launch/terminate EC2 instances

resource "aws_iam_role" "karpenter_controller" {
  name = "${var.project}-karpenter-controller-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.eks_oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${var.eks_oidc_provider}:sub" = "system:serviceaccount:kube-system:karpenter"
          "${var.eks_oidc_provider}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "karpenter_controller" {
  name = "${var.project}-karpenter-controller-policy"
  role = aws_iam_role.karpenter_controller.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateLaunchTemplate",
          "ec2:CreateFleet",
          "ec2:RunInstances",
          "ec2:CreateTags",
          "ec2:TerminateInstances",
          "ec2:DeleteLaunchTemplate",
          "ec2:DescribeLaunchTemplates",
          "ec2:DescribeInstances",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
          "ec2:DescribeInstanceTypes",
          "ec2:DescribeInstanceTypeOfferings",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeSpotPriceHistory",
          "pricing:GetProducts",
          "ssm:GetParameter", # for AMI discovery
        ]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = "iam:PassRole"
        Resource = aws_iam_role.eks_node.arn
      }
    ]
  })
}

# Instance profile so Karpenter-launched nodes can assume the node role
resource "aws_iam_instance_profile" "karpenter_node" {
  name = "${var.project}-karpenter-node-profile"
  role = aws_iam_role.eks_node.name
  tags = var.tags
}
