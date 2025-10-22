# AWS Calculator Results - GitHub Dashboard Infrastructure

## 1K Users Scenario (Staging)

### EC2 Instances - t3.small Spot

- **Instance Type**: t3.small (2 vCPUs, 2 GiB Memory)
- **Quantity**: 2 instances
- **Pricing**: Spot Instances
- **Historical Discount**: 66% off regular pricing
- **Spot Price**: $0.0248/hour per instance
- **Monthly Cost**: $18.47/month

### AWS Calculator Results

- **Monthly Cost**: $18.47/month for 2 t3.small Spot instances
- **Spot Price**: $0.0248/hour per instance
- **Historical Discount**: 66% off regular pricing

## 10K Users Scenario (Production)

### EC2 Instances - t3.medium Spot

- **Instance Type**: t3.medium (2 vCPUs, 4 GiB Memory)
- **Quantity**: 3 instances (2 Spot + 1 On-Demand)
- **Pricing**: Mixed (Spot + On-Demand)
- **Spot Instances (2)**: $36.57/month
- **On-Demand (1)**: $36.21/month
- **Total Monthly Cost**: $72.78/month

## RDS PostgreSQL vs Aurora Comparison

### RDS PostgreSQL (Standard)

#### 1K Users Scenario

- **Instance Class**: db.t3.small
- **Quantity**: 1
- **Engine**: PostgreSQL
- **Region**: US West (Oregon)
- **Hours**: 730
- **Monthly Cost**: $69.35

#### 10K Users Scenario

- **Instance Class**: db.t3.medium
- **Quantity**: 1
- **Engine**: PostgreSQL
- **Region**: US West (Oregon)
- **Hours**: 730
- **Monthly Cost**: $138.70

### Aurora PostgreSQL (Serverless)

#### 1K Users Scenario

- **Instance Class**: db.t3.medium
- **Quantity**: 1
- **Engine**: Aurora PostgreSQL
- **Region**: US West (Oregon)
- **Hours**: 730
- **Monthly Cost**: $77.38

#### 10K Users Scenario

- **Instance Class**: db.t3.medium
- **Quantity**: 1 (Primary)
- **Engine**: Aurora PostgreSQL
- **Region**: US West (Oregon)
- **Hours**: 730
- **Storage**: 100 GB
- **Monthly Cost**: $130.57

## Application Load Balancer (ALB)

### 1K Users Scenario

- **Load Balancers**: 1
- **Processed bytes**: 1.40 LCUs
- **New connections**: 0.08 LCUs
- **Active connections**: 0.02 LCUs
- **Rule evaluations**: 0 LCUs (free rules)
- **Maximum LCUs**: 1.40 LCUs
- **Monthly Cost**: $8.18

### 10K Users Scenario

- **Load Balancers**: 1
- **Processed bytes**: 7.00 LCUs
- **New connections**: 0.40 LCUs
- **Active connections**: 0.10 LCUs
- **Rule evaluations**: 0 LCUs (free rules)
- **Maximum LCUs**: 7.00 LCUs
- **Monthly Cost**: $40.88

## Simplified Infrastructure (Real App Needs)

### Essential Services Only:

- ✅ EC2 Instances - To run your app
- ✅ Application Load Balancer - To distribute traffic
- 🔄 RDS Aurora PostgreSQL - For your database
- ⏳ NAT Gateway - For outbound internet access

## Next Steps

1. ✅ EC2 Instances - Completed
2. ✅ Application Load Balancer - Completed
3. 🔄 RDS Aurora PostgreSQL - In Progress
4. ⏳ NAT Gateway
5. ⏳ Compare total costs

## Key Insights

- **AWS Calculator provides accurate pricing** for all services
- **Spot instances provide significant savings** (66% discount)
- **Real AWS pricing** is the most reliable source
- **Need to calculate all services** to get complete picture
