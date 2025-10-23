# GitHub Dashboard - Local Demo Outputs
# Simplified outputs for demo purposes (no actual AWS resources)

# Environment Information
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

# Infrastructure Configuration
output "instance_count" {
  description = "Number of EKS instances"
  value       = local.current_config.instance_count
}

output "instance_type" {
  description = "EKS instance type"
  value       = local.current_config.instance_type
}

output "db_instance_class" {
  description = "Database instance class"
  value       = local.current_config.database_instance_class
}

output "min_capacity" {
  description = "Minimum auto-scaling capacity"
  value       = 1
}

output "max_capacity" {
  description = "Maximum auto-scaling capacity"
  value       = local.current_config.instance_count + 2
}

# Cost Analysis
output "estimated_monthly_cost" {
  description = "Estimated monthly cost based on configuration"
  value = var.environment == "production" ? "$783.50" : "$200.90"
}

output "cost_per_user" {
  description = "Estimated cost per user"
  value = var.environment == "production" ? "$0.08" : "$0.20"
}

# Demo Information
output "demo_notes" {
  description = "Demo configuration notes"
  value = {
    scenario = var.environment == "production" ? "10K Users" : "1K Users"
    infrastructure = var.environment == "production" ? "3x t3.medium, Multi-AZ" : "2x t3.small, Single AZ"
    performance_threshold = "p95 < 800ms, Error rate < 1%"
    cost_optimization = "Spot instances, S3 Intelligent Tiering, CloudFront"
  }
}
