# Demo 3: Infrastructure & Cost Planning - GitHub Dashboard

Purpose: Build Terraform infrastructure for github-dashboard app with cost optimization focus, comparing 1K vs 10K users scenarios.

> **📖 See the [GitHub Dashboard README](../packages/github-dashboard/README.md) for current implementation status and features.**

## 🎯 Goals & Requirements

### Primary Goals

- [ ] Build Terraform that provisions infrastructure for github-dashboard app
- [ ] Focus on cost optimization and realistic production planning
- [ ] Compare 1,000 users/month vs 10,000 users/month scenarios
- [ ] Use existing platform patterns from `agent_context/devops/`
- [ ] Implement proper resource tagging for cost allocation
- [ ] Validate with `terraform init`, `validate`, and `plan`
- [ ] Use AWS Calculator for cost analysis
- [ ] Document financial impact of infrastructure choices

### Teachback Format

1. **5 minutes**: What you built and how it works
   - Explain system requirements you chose
   - Show terraform plan output
   - Explain business value of infrastructure choices
2. **2 minutes**: What tripped you up and how you solved it
3. **2 minutes**: A best practice you now have that you didn't have before
   - Share one DevOps insight that will change how you write code
   - Explain why this matters to your team's productivity

## 📋 Task List

- [x] Analyze github-dashboard demo app architecture
- [x] Create production requirements and resource categories
- [x] Build initial Terraform infrastructure (`main.tf`, `variables.tf`)
- [x] Create performance testing script (`performance-test.js`)
- [x] Create demo data generator (`generate-demo-data.js`)
- [x] Create comprehensive demo plan and task delegation
- [x] Update documentation format to match consistent pattern across all demos
- [ ] Run performance tests to get realistic estimates
- [ ] Generate demo data for storage estimates
- [ ] Complete Terraform configuration (outputs, tfvars, validation)
- [ ] Add `outputs.tf` with key infrastructure outputs
- [ ] Add `terraform.tfvars` files for different scenarios
- [ ] Add Kubernetes manifests for application deployment
- [ ] Add monitoring and alerting configuration
- [ ] Calculate costs for 1K users scenario using AWS Calculator
- [ ] Calculate costs for 10K users scenario using AWS Calculator
- [ ] Identify cost optimization opportunities
- [ ] Document unexpected cost scenarios
- [ ] Run `terraform init` and fix any issues
- [ ] Run `terraform validate` and fix syntax errors
- [ ] Run `terraform plan` and review resource creation
- [ ] Document any validation challenges
- [ ] Document resource categories and sizing decisions
- [ ] Explain cost optimization strategies
- [ ] Document tagging strategy and compliance
- [ ] Create cost comparison analysis
- [ ] Prepare 5-minute demo script
- [ ] Prepare terraform plan output examples
- [ ] Prepare cost analysis charts
- [ ] Prepare challenges and solutions summary
- [ ] Prepare best practices summary

## 🏗️ Infrastructure Architecture

### Resource Categories Identified

1. **Compute Resources**

   - EKS Cluster (container orchestration)
   - Node Groups (Spot instances for cost optimization)
   - Auto Scaling Groups

2. **Data Storage**

   - Aurora PostgreSQL (managed database)
   - S3 Buckets (static assets, exports, backups)
   - EBS Volumes (container storage)

3. **Network & CDN**

   - VPC with public/private subnets
   - Application Load Balancer
   - CloudFront Distribution
   - NAT Gateway

4. **Security & Compliance**

   - KMS Keys (encryption)
   - Secrets Manager (credentials)
   - IAM Roles and Policies
   - Security Groups

5. **Monitoring & Logging**
   - CloudWatch Log Groups
   - CloudWatch Alarms
   - Cost and Billing Alerts

### Environment Configuration

- **Local Development**: Focus on learning and cost analysis (no actual deployment)
- **Scenario 1**: 1K users configuration (cost-optimized)
- **Scenario 2**: 10K users configuration (high availability)

## 💰 Cost Scenarios to Analyze

### Scenario 1: 1,000 Users/Month (Staging)

- **Target**: Cost-optimized development/staging environment
- **Resources**: Smaller instances, single AZ, minimal redundancy
- **Focus**: Learning and development costs

### Scenario 2: 10,000 Users/Month (Production)

- **Target**: Production-ready with high availability
- **Resources**: Larger instances, multi-AZ, full redundancy
- **Focus**: Production costs and scaling

### Cost Optimization Strategies

- [ ] Spot instances for non-critical workloads
- [ ] Aurora Serverless v2 for variable workloads
- [ ] S3 Intelligent Tiering for storage optimization
- [ ] CloudFront for bandwidth cost reduction
- [ ] Reserved instances for predictable workloads

## 🧪 Testing & Validation Plan

### Performance Testing

```bash
# Run performance tests to get realistic estimates
node performance-test.js
```

### Load Testing (tools)

Seeded data assumptions for load tests:

- Clients: Candy Corn Labs (basic) and Haunted Hollow (premium) only (from migrations)
- We scale GitHub users tracked and read/query load; no new clients are created

Commands (run locally):

```bash
# k6 (install with Homebrew):
pnpm --filter @tools/load-testing run k6          # default
pnpm --filter @tools/load-testing run k6:1k       # ~100–200 concurrent users
pnpm --filter @tools/load-testing run k6:10k      # ~1,000–2,000 concurrent users

# Artillery (optional; install into the tool package first):
pnpm --filter @tools/load-testing add -D artillery
pnpm --filter @tools/load-testing run artillery
```

Outputs:

- Saved to `packages/github-dashboard/perf-results/` (JSON summaries per tool)
- Capture p95 latency, max RPS, error rate; note DB connection pressure if observable

### Data Generation

```bash
# Generate demo data for storage estimates
node generate-demo-data.js
```

### Terraform Validation

```bash
# Initialize and validate Terraform
cd infrastructure/
terraform init
terraform validate
terraform plan
```

### Cost Analysis

- Use AWS Calculator for detailed cost estimates
- Compare staging vs production scenarios
- Identify cost optimization opportunities

## 📊 Expected Deliverables

### Infrastructure Files

- [ ] `infrastructure/main.tf` - Main Terraform configuration
- [ ] `infrastructure/variables.tf` - Variable definitions
- [ ] `infrastructure/outputs.tf` - Output values
- [ ] `infrastructure/terraform.tfvars` - Environment-specific values
- [ ] `infrastructure/k8s/` - Kubernetes manifests

### Analysis Files

- [ ] `cost-analysis.md` - Detailed cost comparison
- [ ] `performance-results.json` - Performance testing results
- [ ] `demo-data/` - Generated demo data for testing

### Demo Materials

- [ ] `teachback-script.md` - 5-minute demo script
- [ ] `terraform-plan-output.txt` - Sample terraform plan
- [ ] `cost-comparison-charts.png` - Visual cost analysis
- [ ] `challenges-solutions.md` - What went wrong and how we fixed it
- [ ] `best-practices.md` - Key learnings and insights

## ❓ Questions for You

### Immediate Questions

1. **Which environment should we focus on first?** (Staging for 1K users or Production for 10K users?)
2. **Do you want to run the performance tests now?** (I can help you execute them)
3. **Should I complete the Terraform configuration first?** (Add outputs, tfvars, etc.)
4. **What's your preferred approach for the demo?** (Live coding vs prepared materials?)

### Technical Questions

1. **Database preferences?** (Aurora vs RDS, Serverless vs Provisioned?)
2. **Scaling strategy?** (Horizontal vs Vertical, Auto-scaling preferences?)
3. **Cost optimization priorities?** (Which areas are most important to optimize?)

### Demo Questions

1. **What challenges do you want to highlight?** (Terraform validation, cost surprises, etc.)
2. **What best practices do you want to emphasize?** (Tagging, monitoring, security?)
3. **How technical should the demo be?** (High-level overview vs detailed implementation?)

## 🚀 Next Steps

### Immediate Actions (You)

1. **Review this plan** and provide feedback
2. **Answer the questions above** to guide the implementation
3. **Run the performance tests** to get baseline estimates
4. **Review the current Terraform configuration** for any changes

### Immediate Actions (AI Assistant)

1. **Complete Terraform configuration** (outputs, tfvars, validation)
2. **Run cost analysis** using AWS Calculator
3. **Generate demo materials** for teachback
4. **Document challenges and solutions** as we encounter them

## 📝 Progress Tracking

### Current Status

- [x] Infrastructure analysis and planning
- [x] Initial Terraform configuration
- [x] Performance testing setup
- [ ] Cost analysis and optimization
- [ ] Terraform validation and testing
- [ ] Demo preparation and practice
- [ ] Final cost analysis and documentation
- [ ] Teachback materials preparation

---

**Note**: This document will be updated as we progress through the tasks. Each completed task should be checked off, and new tasks should be added as they're identified.
