# GitHub Dashboard - Production Infrastructure
# Terraform configuration for cost-optimized production deployment

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.84"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0"
    }
  }

  backend "s3" {
    bucket         = "platform-terraform-state"
    key            = "github-dashboard/production/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}

# Provider configuration
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# Local values for computed configurations
locals {
  # Common tags following platform patterns
  common_tags = {
    # Cost Allocation
    "internal:cost-allocation:Application" = "github-dashboard"
    "internal:cost-allocation:Project"     = "Demo Infrastructure"
    "internal:cost-allocation:Client"      = "Internal"
    "internal:cost-allocation:Owner"       = "Engineering"

    # Operations
    "internal:operations:Environment"      = var.environment
    "internal:operations:ManagedBy"        = "Terraform"
    "internal:operations:MaintenanceWindow" = "sun-2am-sun-4am"
    "internal:operations:BackupWindow"     = "daily-3am"
    "internal:operations:Lifecycle"        = "long-lived"
    "internal:operations:Owner"            = "DevOps"
    "internal:operations:Project"          = "internal/platform"

    # Data Classification
    "internal:data:Classification"         = "Private"

    # Compliance
    "internal:compliance:Framework"        = "SOC2"
  }

  # Environment-specific configuration
  environment_config = {
    production = {
      # 10K users scenario
      instance_count = 3
      instance_type  = "t3.medium"
      db_instance_class = "db.t3.medium"
      min_capacity = 2
      max_capacity = 10
    }
    staging = {
      # 1K users scenario  
      instance_count = 2
      instance_type  = "t3.small"
      db_instance_class = "db.t3.small"
      min_capacity = 1
      max_capacity = 5
    }
  }

  # Computed values
  current_config = local.environment_config[var.environment]
  
  # Naming convention
  name_prefix = "${var.environment}-github-dashboard"
}

# VPC and Networking
module "networking" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${local.name_prefix}-vpc"
  cidr = var.vpc_cidr

  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = [for i in range(3) : cidrsubnet(var.vpc_cidr, 8, i)]
  public_subnets  = [for i in range(3) : cidrsubnet(var.vpc_cidr, 8, i + 10)]

  enable_nat_gateway = true
  enable_vpn_gateway = false
  enable_dns_hostnames = true
  enable_dns_support = true

  tags = local.common_tags
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "${local.name_prefix}-eks"
  cluster_version = "1.27"

  vpc_id                         = module.networking.vpc_id
  subnet_ids                     = module.networking.private_subnets
  cluster_endpoint_public_access = true

  # EKS Managed Node Groups
  eks_managed_node_groups = {
    main = {
      name = "main"

      instance_types = [local.current_config.instance_type]

      min_size     = local.current_config.min_capacity
      max_size     = local.current_config.max_capacity
      desired_size = local.current_config.instance_count

      # Use Spot instances for cost optimization
      capacity_type = "SPOT"

      # Enable detailed monitoring
      enable_monitoring = true

      # Node group tags
      tags = merge(local.common_tags, {
        "k8s.io/cluster-autoscaler/enabled" = "true"
        "k8s.io/cluster-autoscaler/${local.name_prefix}-eks" = "owned"
      })
    }
  }

  # Cluster access entry
  manage_aws_auth_configmap = true
  aws_auth_roles = [
    {
      rolearn  = aws_iam_role.eks_admin.arn
      username = "admin"
      groups   = ["system:masters"]
    }
  ]

  tags = local.common_tags
}

# IAM role for EKS admin access
resource "aws_iam_role" "eks_admin" {
  name = "${local.name_prefix}-eks-admin"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Aurora PostgreSQL Cluster
module "aurora_cluster" {
  source = "terraform-aws-modules/rds-aurora/aws"
  version = "~> 8.0"

  name           = "${local.name_prefix}-aurora"
  engine         = "aurora-postgresql"
  engine_version = "15.4"
  engine_mode    = "provisioned"

  # Instance configuration
  instance_class = local.current_config.db_instance_class
  instances = {
    writer = {
      instance_class = local.current_config.db_instance_class
    }
    reader = {
      instance_class = local.current_config.db_instance_class
      count         = var.environment == "production" ? 1 : 0
    }
  }

  # Network configuration
  vpc_id               = module.networking.vpc_id
  db_subnet_group_name = aws_db_subnet_group.aurora.name
  security_group_rules = {
    vpc_ingress = {
      cidr_blocks = [module.networking.vpc_cidr_block]
    }
  }

  # Backup configuration
  backup_retention_period = var.environment == "production" ? 7 : 3
  preferred_backup_window = "03:00-06:00"
  preferred_maintenance_window = "Sun:08:00-Sun:10:00"

  # Security
  storage_encrypted = true
  kms_key_id       = aws_kms_key.aurora.arn
  deletion_protection = var.environment == "production" ? true : false

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  # Database configuration
  database_name = "github_dashboard"
  master_username = "postgres"
  manage_master_user_password = true

  tags = local.common_tags
}

# DB Subnet Group
resource "aws_db_subnet_group" "aurora" {
  name       = "${local.name_prefix}-aurora-subnet-group"
  subnet_ids = module.networking.private_subnets

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-subnet-group"
  })
}

# KMS Key for Aurora encryption
resource "aws_kms_key" "aurora" {
  description             = "KMS key for Aurora encryption"
  deletion_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-kms"
  })
}

# IAM role for RDS enhanced monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${local.name_prefix}-rds-enhanced-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# S3 Bucket for static assets and exports
module "s3_bucket" {
  source = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

  bucket = "${local.name_prefix}-assets-${random_string.bucket_suffix.result}"

  # Versioning
  versioning = {
    enabled = true
  }

  # Lifecycle rules for cost optimization
  lifecycle_rule = [
    {
      id     = "transition_to_ia"
      status = "Enabled"
      transitions = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        },
        {
          days          = 90
          storage_class = "GLACIER"
        }
      ]
    }
  ]

  # Encryption
  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "AES256"
      }
    }
  }

  # Block public access
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  tags = local.common_tags
}

# Random string for S3 bucket suffix
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# CloudFront Distribution for CDN
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = module.s3_bucket.s3_bucket_bucket_regional_domain_name
    origin_id   = "S3-${module.s3_bucket.s3_bucket_id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${module.s3_bucket.s3_bucket_id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # Price class for cost optimization
  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = local.common_tags
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "OAI for ${local.name_prefix}"
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.networking.public_subnets

  enable_deletion_protection = var.environment == "production" ? true : false

  tags = local.common_tags
}

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  vpc_id      = module.networking.vpc_id

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

# Secrets Manager for database credentials
resource "aws_secretsmanager_secret" "database_credentials" {
  name = "${var.environment}/github-dashboard/database/credentials"

  description = "Database credentials for GitHub Dashboard"

  tags = merge(local.common_tags, {
    "internal:data:Classification" = "Confidential"
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/eks/${local.name_prefix}/application"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "database" {
  name              = "/aws/rds/${local.name_prefix}/database"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = local.common_tags
}


