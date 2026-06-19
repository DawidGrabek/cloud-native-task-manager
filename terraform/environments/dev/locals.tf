locals {
  # EKS cluster name derived from project + environment
  cluster_name = "${var.project}-${var.environment}"
}
