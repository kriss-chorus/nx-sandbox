# Performance Testing - GitHub Dashboard

Purpose: Document performance testing execution and results to inform infrastructure sizing and cost analysis for 1K vs 10K users scenarios.

> **📖 Part of [Demo 3: Infrastructure & Cost Planning](./03-demo-infrastructure-cost-planning.md)**

> **📖 See the [GitHub Dashboard README](../packages/github-dashboard/README.md) for current implementation status and features.**

## 🎯 Testing Strategy

### Test Approach

- **Page Load Testing**: Simulate real user behavior visiting dashboard pages
- **Client-Specific Testing**: Test both Candy Corn Labs (basic) and Haunted Hollow (premium) dashboards
- **Incremental Data**: Start with seeded data, then scale up for realistic scenarios

### Test Scenarios

| Scenario      | Users/Month | Concurrent Users | Duration | Data Volume                                   | Purpose                        |
| ------------- | ----------- | ---------------- | -------- | --------------------------------------------- | ------------------------------ |
| **Baseline**  | 100         | 10-20            | 60s      | 2 clients, 2 dashboards, 5 GitHub users       | Establish baseline performance |
| **1K Users**  | 1,000       | 150              | 180s     | 2 clients, 20 dashboards, 100 GitHub users    | Test moderate load             |
| **5K Users**  | 5,000       | 750              | 300s     | 2 clients, 50 dashboards, 500 GitHub users    | Test scaling behavior          |
| **10K Users** | 10,000      | 1,500            | 300s     | 2 clients, 100 dashboards, 1,000 GitHub users | Test high load                 |

## 📊 Test Execution Plan

### Phase 1: Baseline Testing (Current Seeded Data)

| Test ID | Description                         | Load        | Expected Results       | Status     |
| ------- | ----------------------------------- | ----------- | ---------------------- | ---------- |
| **B1**  | Dashboard page loads (both clients) | 20 VUs, 60s | p95 < 200ms, 0% errors | ⏳ Pending |
| **B2**  | Homepage + dashboard navigation     | 20 VUs, 60s | p95 < 300ms, 0% errors | ⏳ Pending |
| **B3**  | Mixed client access patterns        | 20 VUs, 60s | p95 < 250ms, 0% errors | ⏳ Pending |

### Phase 2: 1K Users Scenario

| Test ID  | Description                | Load          | Expected Results        | Status     |
| -------- | -------------------------- | ------------- | ----------------------- | ---------- |
| **1K-1** | Dashboard page loads       | 150 VUs, 180s | p95 < 500ms, <1% errors | ⏳ Pending |
| **1K-2** | Client-specific dashboards | 150 VUs, 180s | p95 < 600ms, <1% errors | ⏳ Pending |
| **1K-3** | Peak load simulation       | 200 VUs, 120s | p95 < 800ms, <2% errors | ⏳ Pending |

### Phase 3: 10K Users Scenario

| Test ID   | Description                     | Load            | Expected Results        | Status     |
| --------- | ------------------------------- | --------------- | ----------------------- | ---------- |
| **10K-1** | High concurrent dashboard loads | 1,500 VUs, 300s | p95 < 1s, <5% errors    | ⏳ Pending |
| **10K-2** | Sustained load testing          | 1,000 VUs, 600s | p95 < 800ms, <3% errors | ⏳ Pending |
| **10K-3** | Stress testing                  | 2,000 VUs, 180s | p95 < 2s, <10% errors   | ⏳ Pending |

## 🧪 Test Configuration

### k6 Load Testing Scripts

| Script        | Target          | VUs   | Duration | Description          |
| ------------- | --------------- | ----- | -------- | -------------------- |
| `k6:baseline` | Dashboard pages | 20    | 60s      | Baseline performance |
| `k6:1k`       | Dashboard pages | 150   | 180s     | 1K users simulation  |
| `k6:10k`      | Dashboard pages | 1,500 | 300s     | 10K users simulation |

### Test URLs

| Client          | Dashboard       | URL                                                                    | Tier    |
| --------------- | --------------- | ---------------------------------------------------------------------- | ------- |
| Candy Corn Labs | First Dashboard | `http://localhost:8080/dashboard/22fdda0c-3224-4153-bb5c-edb0b7e7a821` | Basic   |
| Haunted Hollow  | Haunted Board   | `http://localhost:8080/dashboard/97e807a7-7c24-45df-9ba6-3c58f36d7c51` | Premium |
| -               | Homepage        | `http://localhost:8080/`                                               | -       |

## 📈 Results Tracking

### Performance Metrics

| Metric                   | Baseline Target | 1K Users Target | 10K Users Target | Actual Results |
| ------------------------ | --------------- | --------------- | ---------------- | -------------- |
| **Response Time (p95)**  | < 200ms         | < 500ms         | < 1s             | TBD            |
| **Response Time (p99)**  | < 300ms         | < 800ms         | < 2s             | TBD            |
| **Error Rate**           | 0%              | < 1%            | < 5%             | TBD            |
| **Throughput (RPS)**     | > 50            | > 200           | > 500            | TBD            |
| **Database Connections** | < 10            | < 50            | < 100            | TBD            |

### Infrastructure Sizing Insights

| Scenario      | Compute Needs        | Database Needs       | Storage Needs | Network Needs  |
| ------------- | -------------------- | -------------------- | ------------- | -------------- |
| **Baseline**  | 1 small instance     | 1 small DB           | Minimal       | Basic          |
| **1K Users**  | 2-3 medium instances | 1 medium DB          | Moderate      | Standard       |
| **10K Users** | 5-10 large instances | 1 large DB + replica | High          | High bandwidth |

## 🚀 Execution Commands

### Run Tests

```bash
# Baseline testing
pnpm nx run load-testing:k6

# 1K users scenario
pnpm nx run load-testing:k6:1k

# 10K users scenario
pnpm nx run load-testing:k6:10k
```

### Generate Test Data

```bash
# Generate data for 1K users scenario
cd packages/github-dashboard
node generate-demo-data.js --scenario=1k

# Generate data for 10K users scenario
node generate-demo-data.js --scenario=10k
```

## 📋 Test Results Template

### Test Execution Log

| Test ID | Start Time | End Time | Duration | Status     | Notes                     |
| ------- | ---------- | -------- | -------- | ---------- | ------------------------- |
| B1      | TBD        | TBD      | TBD      | ⏳ Pending | Baseline dashboard loads  |
| B2      | TBD        | TBD      | TBD      | ⏳ Pending | Homepage + navigation     |
| 1K-1    | TBD        | TBD      | TBD      | ⏳ Pending | 1K users dashboard loads  |
| 10K-1   | TBD        | TBD      | TBD      | ⏳ Pending | 10K users dashboard loads |

### Performance Results

| Test ID | p50 (ms) | p95 (ms) | p99 (ms) | Error Rate | RPS | Notes                |
| ------- | -------- | -------- | -------- | ---------- | --- | -------------------- |
| B1      | TBD      | TBD      | TBD      | TBD        | TBD | Baseline performance |
| B2      | TBD      | TBD      | TBD      | TBD        | TBD | Navigation testing   |
| 1K-1    | TBD      | TBD      | TBD      | TBD        | TBD | Moderate load        |
| 10K-1   | TBD      | TBD      | TBD      | TBD        | TBD | High load            |

## 🎯 Next Steps

1. **Run baseline tests** with current seeded data
2. **Generate test data** for 1K and 10K scenarios
3. **Execute load tests** for each scenario
4. **Analyze results** and document infrastructure needs
5. **Update Terraform** configuration based on findings
6. **Calculate costs** using AWS Calculator

---

**Note**: This document will be updated as tests are executed and results are collected. Each test should be documented with actual performance metrics and infrastructure recommendations.
