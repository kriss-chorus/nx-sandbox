# GitHub Dashboard - Infrastructure Variables

variable "environment" {
  description = "The environment name (staging, production)"
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be one of: staging, production."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# Cost optimization variables
variable "enable_spot_instances" {
  description = "Enable Spot instances for cost optimization"
  type        = bool
  default     = true
}

variable "enable_aurora_serverless" {
  description = "Enable Aurora Serverless v2 for cost optimization"
  type        = bool
  default     = false
}

variable "enable_cloudfront" {
  description = "Enable CloudFront CDN for performance and cost optimization"
  type        = bool
  default     = true
}

# Scaling variables
variable "min_capacity" {
  description = "Minimum number of instances"
  type        = number
  default     = null
}

variable "max_capacity" {
  description = "Maximum number of instances"
  type        = number
  default     = null
}

variable "desired_capacity" {
  description = "Desired number of instances"
  type        = number
  default     = null
}

# Database variables
variable "db_instance_class" {
  description = "Database instance class"
  type        = string
  default     = null
}

variable "backup_retention_period" {
  description = "Number of days to retain database backups"
  type        = number
  default     = null
}

# Monitoring variables
variable "enable_detailed_monitoring" {
  description = "Enable detailed monitoring for cost tracking"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = null
}

# Cost allocation variables
variable "cost_center" {
  description = "Cost center for budget allocation"
  type        = string
  default     = "Engineering"
}

variable "project_name" {
  description = "Project name for cost tracking"
  type        = string
  default     = "GitHub Dashboard Demo"
}

# Security variables
variable "enable_deletion_protection" {
  description = "Enable deletion protection for production resources"
  type        = bool
  default     = null
}

variable "data_classification" {
  description = "Data classification level"
  type        = string
  default     = "Private"
}

variable "compliance_framework" {
  description = "Compliance framework"
  type        = string
  default     = "SOC2"
}



