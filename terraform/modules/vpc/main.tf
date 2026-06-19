# =============================================================================
# VPC MODULE
# Creates a production-grade VPC with public/private subnets across 2 AZs.
#
# Concept: Network isolation — app nodes run in private subnets (no direct
# internet exposure), only ALB lives in public subnets.
# =============================================================================

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }
}

# ─── VPC ─────────────────────────────────────────────────────────────────────

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true # required for EKS
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.project}-vpc"
    # Required tag for AWS Load Balancer Controller to discover the VPC
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  })
}

# ─── INTERNET GATEWAY ────────────────────────────────────────────────────────

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(var.tags, { Name = "${var.project}-igw" })
}

# ─── SUBNETS ─────────────────────────────────────────────────────────────────

# Public subnets — for ALB (load balancer must be in public subnets)
resource "aws_subnet" "public" {
  count             = length(var.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.azs[count.index]

  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.project}-public-${var.azs[count.index]}"
    # Required by AWS Load Balancer Controller to place ALB here
    "kubernetes.io/role/elb"                        = "1"
    "kubernetes.io/cluster/${var.cluster_name}"     = "shared"
  })
}

# Private subnets — for EKS nodes (not directly reachable from internet)
resource "aws_subnet" "private" {
  count             = length(var.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.azs[count.index]

  tags = merge(var.tags, {
    Name = "${var.project}-private-${var.azs[count.index]}"
    # Required by AWS Load Balancer Controller for internal LBs
    "kubernetes.io/role/internal-elb"               = "1"
    "kubernetes.io/cluster/${var.cluster_name}"     = "shared"
    # Required by Karpenter to discover subnets for node placement
    "karpenter.sh/discovery"                        = var.cluster_name
  })
}

# ─── NAT GATEWAY ─────────────────────────────────────────────────────────────
# Single NAT GW (dev cost optimization — in prod you'd have one per AZ)
# Allows private subnet nodes to reach internet (for ECR image pulls, etc.)

resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = merge(var.tags, { Name = "${var.project}-nat-eip" })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id # attach to first public subnet

  tags = merge(var.tags, { Name = "${var.project}-nat-gw" })

  depends_on = [aws_internet_gateway.main]
}

# ─── ROUTE TABLES ────────────────────────────────────────────────────────────

# Public route table: routes all outbound traffic through IGW
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, { Name = "${var.project}-rt-public" })
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private route table: routes outbound through NAT GW
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = merge(var.tags, { Name = "${var.project}-rt-private" })
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
