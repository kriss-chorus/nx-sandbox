# Infrastructure Resource Categories and Sizing Decisions

Based on performance testing results and cost optimization requirements for 1K vs 10K users scenarios.

## 📊 Performance Testing Foundation

### Key Performance Metrics

- **1K Users**: 150 VUs, p95: 325ms, 0% errors ✅ PASS
- **10K Users**: 1,500 VUs, p95: 10,000ms, 0.1% errors ❌ FAIL
- **Performance Thresholds**: p95 < 800ms, Error rate < 1%

### Infrastructure Sizing Logic

- **150 VUs consistently pass** → 2x t3.small instances sufficient
- **1,500 VUs consistently fail** → Need 3x t3.medium + optimization
- **Data volume minimal impact** → Focus on compute scaling

## 🏗️ Resource Categories

### 1. Compute Resources

#### EKS Cluster Configuration

| Scenario      | Instance Type | Count | Capacity   | Rationale                           |
| ------------- | ------------- | ----- | ---------- | ----------------------------------- |
| **1K Users**  | t3.small      | 2     | 1-5 nodes  | 150 VUs pass performance thresholds |
| **10K Users** | t3.medium     | 3     | 2-10 nodes | 1,500 VUs fail, need more capacity  |

#### Auto-Scaling Configuration

| Scenario      | Min Capacity | Max Capacity | Scaling Strategy                           |
| ------------- | ------------ | ------------ | ------------------------------------------ |
| **1K Users**  | 1            | 5            | Conservative scaling for cost optimization |
| **10K Users** | 2            | 10           | Aggressive scaling for performance         |

#### Instance Type Selection

**t3.small (1K Users)**

- **vCPUs**: 2
- **Memory**: 2 GB
- **Network**: Up to 5 Gbps
- **Cost**: $0.0208/hour (Spot: $0.0062/hour)
- **Use Case**: Light workloads, cost optimization

**t3.medium (10K Users)**

- **vCPUs**: 2
- **Memory**: 4 GB
- **Network**: Up to 5 Gbps
- **Cost**: $0.0416/hour (Spot: $0.0125/hour)
- **Use Case**: Moderate workloads, balanced performance

### 2. Database Resources

#### Aurora PostgreSQL Configuration

| Scenario      | Instance Class | Read Replicas | Backup Retention |
| ------------- | -------------- | ------------- | ---------------- |
| **1K Users**  | db.t3.small    | 0             | 3 days           |
| **10K Users** | db.t3.medium   | 1             | 7 days           |

#### Database Sizing Rationale

**1K Users (db.t3.small)**

- **vCPUs**: 2
- **Memory**: 2 GB
- **Storage**: 20 GB - 64 TB
- **Cost**: $0.041/hour
- **Performance**: Sufficient for 150 VUs

**10K Users (db.t3.medium)**

- **vCPUs**: 2
- **Memory**: 4 GB
- **Storage**: 20 GB - 64 TB
- **Cost**: $0.083/hour
- **Performance**: Required for 1,500 VUs

### 3. Storage Resources

#### S3 Storage Configuration

| Scenario      | Storage Class    | Lifecycle Policy                | Cost Optimization      |
| ------------- | ---------------- | ------------------------------- | ---------------------- |
| **1K Users**  | Standard (100GB) | 30 days → IA, 90 days → Glacier | S3 Intelligent Tiering |
| **10K Users** | Standard (500GB) | 30 days → IA, 90 days → Glacier | S3 Intelligent Tiering |

#### Storage Sizing Rationale

**1K Users (100GB)**

- **Static assets**: ~50GB
- **Data exports**: ~30GB
- **Backups**: ~20GB
- **Monthly cost**: $2.30

**10K Users (500GB)**

- **Static assets**: ~200GB
- **Data exports**: ~200GB
- **Backups**: ~100GB
- **Monthly cost**: $11.50

### 4. Network Resources

#### Load Balancer Configuration

| Scenario      | Type | AZs | Cost Optimization    |
| ------------- | ---- | --- | -------------------- |
| **1K Users**  | ALB  | 2   | Single AZ deployment |
| **10K Users** | ALB  | 3   | Multi-AZ deployment  |

#### CDN Configuration

| Scenario      | CloudFront | Transfer  | Cost Optimization |
| ------------- | ---------- | --------- | ----------------- |
| **1K Users**  | Enabled    | 1TB/month | Price Class 100   |
| **10K Users** | Enabled    | 5TB/month | Price Class 100   |

### 5. Security Resources

#### KMS Encryption

| Resource            | Encryption       | Key Type   | Cost     |
| ------------------- | ---------------- | ---------- | -------- |
| **Aurora**          | Customer Managed | CMK        | $1/month |
| **S3**              | AES-256          | S3 Managed | $0       |
| **Secrets Manager** | Customer Managed | CMK        | $1/month |

#### Secrets Management

| Secret Type              | Storage         | Rotation  | Cost               |
| ------------------------ | --------------- | --------- | ------------------ |
| **Database Credentials** | Secrets Manager | Automatic | $0.40/secret/month |
| **API Keys**             | Secrets Manager | Manual    | $0.40/secret/month |

### 6. Monitoring Resources

#### CloudWatch Configuration

| Scenario      | Log Retention | Alarms    | Cost         |
| ------------- | ------------- | --------- | ------------ |
| **1K Users**  | 7 days        | 5 alarms  | $5.00/month  |
| **10K Users** | 30 days       | 10 alarms | $25.00/month |

#### Monitoring Sizing

**1K Users (7 days retention)**

- **Application logs**: ~5GB
- **Database logs**: ~3GB
- **System logs**: ~2GB
- **Total**: 10GB

**10K Users (30 days retention)**

- **Application logs**: ~30GB
- **Database logs**: ~15GB
- **System logs**: ~5GB
- **Total**: 50GB

## 💰 Cost Optimization Strategies

### 1. Spot Instances (60-70% savings)

| Instance Type | On-Demand    | Spot         | Savings |
| ------------- | ------------ | ------------ | ------- |
| **t3.small**  | $0.0208/hour | $0.0062/hour | 70%     |
| **t3.medium** | $0.0416/hour | $0.0125/hour | 70%     |

**Risk Mitigation**:

- Mixed instance types (Spot + On-Demand)
- Auto-scaling groups
- Application-level fault tolerance

### 2. S3 Intelligent Tiering (40-60% savings)

| Storage Class | Cost       | Use Case              |
| ------------- | ---------- | --------------------- |
| **Standard**  | $0.023/GB  | Frequently accessed   |
| **IA**        | $0.0125/GB | Infrequently accessed |
| **Glacier**   | $0.004/GB  | Archive               |

### 3. CloudFront CDN (Bandwidth savings)

| Transfer | Direct S3 | CloudFront | Savings |
| -------- | --------- | ---------- | ------- |
| **1TB**  | $0.09/GB  | $0.085/GB  | 5.6%    |
| **5TB**  | $0.09/GB  | $0.085/GB  | 5.6%    |

## 🎯 Sizing Decision Matrix

### Performance-Based Sizing

| Metric                  | 1K Users    | 10K Users    | Threshold             |
| ----------------------- | ----------- | ------------ | --------------------- |
| **Concurrent Users**    | 150         | 1,500        | Based on load testing |
| **Response Time (p95)** | 325ms       | 10,000ms     | < 800ms               |
| **Error Rate**          | 0%          | 0.1%         | < 1%                  |
| **Infrastructure**      | 2x t3.small | 3x t3.medium | Performance-based     |

### Cost-Based Sizing

| Metric            | 1K Users | 10K Users | Optimization       |
| ----------------- | -------- | --------- | ------------------ |
| **Monthly Cost**  | $200.90  | $783.50   | Spot instances     |
| **Cost per User** | $0.20    | $0.08     | Economies of scale |
| **ROI**           | 2.5x     | 10x       | Scaling efficiency |

### Reliability-Based Sizing

| Metric         | 1K Users | 10K Users     | Availability           |
| -------------- | -------- | ------------- | ---------------------- |
| **AZs**        | 2        | 3             | Multi-AZ               |
| **Backups**    | 3 days   | 7 days        | Data protection        |
| **Monitoring** | Basic    | Comprehensive | Operational excellence |

## 📈 Scaling Recommendations

### Horizontal Scaling

1. **Auto-scaling groups** for EKS nodes
2. **Database read replicas** for read scaling
3. **CloudFront** for global content delivery
4. **S3** for unlimited storage scaling

### Vertical Scaling

1. **Instance type upgrades** (t3.small → t3.medium)
2. **Database instance class scaling** (db.t3.small → db.t3.medium)
3. **Storage capacity increases** (100GB → 500GB)
4. **Network bandwidth optimization** (5 Gbps → 10 Gbps)

### Cost Scaling

1. **Reserved instances** for predictable workloads
2. **Spot instances** for variable workloads
3. **S3 Intelligent Tiering** for storage optimization
4. **CloudFront** for bandwidth cost reduction

## 🚨 Monitoring and Alerting

### Performance Thresholds

- **Response Time**: > 800ms (p95)
- **Error Rate**: > 1%
- **Database CPU**: > 80%
- **Database Connections**: > 80

### Cost Thresholds

- **Monthly Cost**: > $100 (staging), > $500 (production)
- **Cost per User**: > $0.25 (staging), > $0.10 (production)
- **Resource Utilization**: < 70% (staging), < 80% (production)

### Scaling Triggers

- **CPU Utilization**: > 70% for 5 minutes
- **Memory Utilization**: > 80% for 5 minutes
- **Response Time**: > 800ms for 2 minutes
- **Error Rate**: > 1% for 2 minutes

---

**Key Insight**: Infrastructure sizing should be based on actual performance testing results, not theoretical calculations. The 1,500 VU failure clearly demonstrated the need for larger instances and better optimization strategies.

