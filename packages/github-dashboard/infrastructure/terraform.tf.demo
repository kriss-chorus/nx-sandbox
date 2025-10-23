# GitHub Dashboard - Demo Infrastructure Configuration
# Shows infrastructure plan without requiring AWS credentials

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.84"
    }
  }

  # Local backend for demo
  backend "local" {
    path = "terraform.tfstate"
  }
}

# Provider configuration (no authentication required for plan)
provider "aws" {
  region = var.aws_region
  skip_credentials_validation = true
  skip_metadata_api_check = true
  skip_region_validation = true
  skip_requesting_account_id = true

  default_tags {
    tags = local.common_tags
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local values for computed configurations
locals {
  name_prefix = "${var.environment}-github-dashboard"
  
  # Hierarchical tagging strategy following platform patterns
  common_tags = {
    # Cost Allocation Tags
    "internal:cost-allocation:Application" = "github-dashboard"
    "internal:cost-allocation:Project"     = "GitHub Dashboard Demo"
    "internal:cost-allocation:Client"      = "Internal"
    "internal:cost-allocation:Owner"       = "Engineering"

    # Operations Tags
    "internal:operations:Environment"      = var.environment
    "internal:operations:ManagedBy"        = "Terraform"
    "internal:operations:MaintenanceWindow" = "sun-2am-sun-4am"
    "internal:operations:BackupWindow"     = "daily-3am"
    "internal:operations:Lifecycle"        = var.environment == "production" ? "deletion-protected" : "long-lived"
    "internal:operations:Owner"            = "DevOps"
    "internal:operations:Project"          = "internal/platform"

    # Data Classification
    "internal:data:Classification"         = "Private"

    # Compliance
    "internal:compliance:Framework"        = "SOC2"
  }

  # Environment-specific configuration
  environment_config = {
    "1k-users" = {
      instance_count = 2
      instance_type  = "t3.small"
      database_instance_class = "db.t3.small"
      database_count = 1
      enable_read_replica = false
    }
    "10k-users" = {
      instance_count = 3
      instance_type  = "t3.medium"
      database_instance_class = "db.t3.medium"
      database_count = 2
      enable_read_replica = true
    }
  }

  current_config = local.environment_config[var.environment]
}

# Demo Infrastructure Resources (shows what would be created)

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Subnets
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = "${var.aws_region}${substr("abc", count.index, 1)}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${count.index + 1}"
  })
}

resource "aws_subnet" "public" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 101}.0/24"
  availability_zone = "${var.aws_region}${substr("abc", count.index, 1)}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${count.index + 1}"
  })
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "${local.name_prefix}-eks"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }

  tags = local.common_tags
}

# EKS IAM Role
resource "aws_iam_role" "eks_cluster" {
  name = "${local.name_prefix}-eks-cluster"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Aurora Database
resource "aws_rds_cluster" "aurora" {
  cluster_identifier = "${local.name_prefix}-aurora"
  engine            = "aurora-postgresql"
  engine_version    = "15.4"
  database_name     = "github_dashboard"
  master_username   = "postgres"
  master_password   = "demo-password"

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"

  storage_encrypted = true
  deletion_protection = false

  tags = local.common_tags
}

resource "aws_rds_cluster_instance" "aurora" {
  count = local.current_config.database_count

  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class    = local.current_config.database_instance_class
  engine            = aws_rds_cluster.aurora.engine

  tags = local.common_tags
}

# Database Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = local.common_tags
}

# Security Groups
resource "aws_security_group" "database" {
  name_prefix = "${local.name_prefix}-database-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-sg"
  })
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  tags = local.common_tags
}

resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

# S3 removed - app doesn't store files

# Secrets Manager
resource "aws_secretsmanager_secret" "database_credentials" {
  name = "${var.environment}/github-dashboard/database/credentials"

  tags = merge(local.common_tags, {
    "internal:data:Classification" = "Confidential"
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/eks/${local.name_prefix}/application"
  retention_in_days = 30

  tags = local.common_tags
}

# SNS Topic
resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"

  tags = local.common_tags
}
