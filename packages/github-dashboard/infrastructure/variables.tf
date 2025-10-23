# GitHub Dashboard Infrastructure Variables
# Following platform patterns from agent_context/devops/

variable "environment" {
  description = "The environment name (1k-users, 10k-users)"
  type        = string

  validation {
    condition     = contains(["1k-users", "10k-users"], var.environment)
    error_message = "Environment must be one of: 1k-users, 10k-users."
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

# Cost Optimization Variables
variable "enable_spot_instances" {
  description = "Enable Spot instances for cost optimization"
  type        = bool
  default     = true
}

variable "enable_cost_optimization" {
  description = "Enable cost optimization features"
  type        = bool
  default     = true
}

# Scaling Variables
variable "min_capacity" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}

# Database Variables
variable "database_engine" {
  description = "Database engine"
  type        = string
  default     = "aurora-postgresql"
}

variable "database_version" {
  description = "Database version"
  type        = string
  default     = "15.4"
}

variable "backup_retention_period" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 7

  validation {
    condition     = var.backup_retention_period >= 1 && var.backup_retention_period <= 35
    error_message = "Backup retention must be between 1 and 35 days."
  }
}

# Monitoring Variables
variable "enable_monitoring" {
  description = "Enable CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30

  validation {
    condition     = var.log_retention_days >= 1 && var.log_retention_days <= 3653
    error_message = "Log retention must be between 1 and 3653 days."
  }
}

# Security Variables
variable "enable_encryption" {
  description = "Enable encryption for all resources"
  type        = bool
  default     = true
}

variable "data_classification" {
  description = "Data classification level"
  type        = string
  default     = "Private"

  validation {
    condition     = contains(["Public", "Private", "Confidential", "Restricted"], var.data_classification)
    error_message = "Data classification must be one of: Public, Private, Confidential, Restricted."
  }
}

# Performance Testing Variables
variable "performance_testing_enabled" {
  description = "Enable performance testing configuration"
  type        = bool
  default     = false
}

variable "expected_user_load" {
  description = "Expected user load for infrastructure sizing"
  type        = number
  default     = 1000
}

# Cost Analysis Variables
variable "cost_optimization_strategy" {
  description = "Cost optimization strategy to apply"
  type        = string
  default     = "balanced"

  validation {
    condition     = contains(["cost-focused", "balanced", "performance-focused"], var.cost_optimization_strategy)
    error_message = "Cost optimization strategy must be one of: cost-focused, balanced, performance-focused."
  }
}

# Additional Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}