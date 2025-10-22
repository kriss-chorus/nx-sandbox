# Performance Testing - GitHub Dashboard

Purpose: Document performance testing execution and results to inform infrastructure sizing and cost analysis for 1K vs 10K users scenarios.

> **📖 Part of [Demo 3: Infrastructure & Cost Planning](./03-demo-infrastructure-cost-planning.md)**

> **📖 See the [GitHub Dashboard README](../packages/github-dashboard/README.md) for current implementation status and features.**

## 🎯 Testing Strategy

### Performance Thresholds

All load tests use the following performance thresholds defined in `packages/tools/load-testing/k6/load-test.js`:

| Metric                  | Threshold | Description                                       |
| ----------------------- | --------- | ------------------------------------------------- |
| **Response Time (p95)** | < 800ms   | 95th percentile response time must be under 800ms |
| **Error Rate**          | < 1%      | Failed request rate must be under 1%              |

**Threshold Definition:**

```javascript
thresholds: {
  http_req_duration: ['p(95)<800'],
  http_req_failed: ['rate<0.01']
}
```

**Test Status:**

- ✅ **PASSED**: All thresholds met
- ❌ **FAILED**: One or more thresholds exceeded

### Test Approach

- **GraphQL Queries**: Test read operations (allDashboards, allClients)
- **GraphQL Mutations**: Test write operations (createDashboard) - 1/3 of VUs
- **Mixed Workload**: Each test includes GraphQL queries, mutations, AND page loads (homepage + dashboard pages)
- **Data Cleanup**: Clean test data between runs to avoid conflicts
- **Incremental Data**: Start with seeded data, then scale up for realistic scenarios

### Data Seeding Strategy

| Load Testing  | Current Seed                     | +1K Data                    | +10K Data                    |
| ------------- | -------------------------------- | --------------------------- | ---------------------------- |
| **20 VUs**    | Test current seed with 20 VUs    | Test 1K data with 20 VUs    | Test 10K data with 20 VUs    |
| **150 VUs**   | Test current seed with 150 VUs   | Test 1K data with 150 VUs   | Test 10K data with 150 VUs   |
| **1,500 VUs** | Test current seed with 1,500 VUs | Test 1K data with 1,500 VUs | Test 10K data with 1,500 VUs |

**Data Generation Process:**

1. **Keep existing clients** (Candy Corn Labs, Haunted Hollow)
2. **Generate GitHub users** based on scenario scale
3. **Create dashboards** linked to existing clients
4. **Generate activities** to simulate real usage patterns
5. **Run performance tests** with realistic data volumes

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

## 🚀 Commands Used

```bash
# Seed data, run test, clean up

node generate-demo-data.js [small|large]
pnpm nx run load-testing:k6[:1k|:10k]
node cleanup-test-data.js
```

## 📋 Test Results Template

### Test Execution Log

| Test ID | Duration | Status       | Notes                                                  |
| ------- | -------- | ------------ | ------------------------------------------------------ |
| B1      | 60s      | ✅ Completed | Baseline test (20 VUs, current seed data)              |
| 1K-1    | 180s     | ✅ Completed | 1K users test (150 VUs, current seed data)             |
| 10K-1   | 300s     | ❌ Failed    | 10K users test (1,500 VUs, current seed data)          |
| B1-S    | 60s      | ✅ Completed | Baseline test (20 VUs, small dataset: 100 users)       |
| 1K-S    | 180s     | ✅ Completed | 1K users test (150 VUs, small dataset: 100 users)      |
| 10K-S   | 300s     | ❌ Failed    | 10K users test (1,500 VUs, small dataset: 100 users)   |
| B1-L    | 60s      | ✅ Completed | Baseline test (20 VUs, large dataset: 1,000 users)     |
| 1K-L    | 180s     | ✅ Completed | 1K users test (150 VUs, large dataset: 1,000 users)    |
| 10K-L   | 300s     | ❌ Failed    | 10K users test (1,500 VUs, large dataset: 1,000 users) |

### Performance Results

| Test ID | p50 (ms) | p95 (ms) | p99 (ms) | Error Rate | RPS   | Notes                                                           |
| ------- | -------- | -------- | -------- | ---------- | ----- | --------------------------------------------------------------- |
| B1      | 5.27     | 13.99    | ~35      | 0.00%      | 43.8  | Baseline test (20 VUs, current seed data)                       |
| 1K-1    | 28.86    | 323.96   | ~910     | 0.00%      | 282.9 | 1K users test (150 VUs, current seed data)                      |
| 10K-1   | 2.74s    | 10.19s   | ~13.8s   | 0.10%      | 350.9 | 10K users test (1,500 VUs, current seed data) - FAILED          |
| B1-S    | 5.66     | 16.38    | ~41      | 0.00%      | 43.3  | Baseline test (20 VUs, small dataset: 100 users)                |
| 1K-S    | 27.91    | 325.96   | ~830     | 0.00%      | 281.9 | 1K users test (150 VUs, small dataset: 100 users)               |
| 10K-S   | 2.70s    | 10.58s   | ~13.0s   | 0.13%      | 341.1 | 10K users test (1,500 VUs, small dataset: 100 users) - FAILED   |
| B1-L    | 5.90     | 20.34    | ~36      | 0.00%      | 43.5  | Baseline test (20 VUs, large dataset: 1,000 users)              |
| 1K-L    | 31.19    | 354.71   | ~835     | 0.00%      | 280.1 | 1K users test (150 VUs, large dataset: 1,000 users)             |
| 10K-L   | 2.77s    | 11.11s   | ~15.3s   | 0.14%      | 334.8 | 10K users test (1,500 VUs, large dataset: 1,000 users) - FAILED |

## 📊 Test Results Summary

### ✅ PASSED Tests

- **B1, B1-S, B1-L**: Baseline tests (20 VUs) - All passed across all data volumes
- **1K-1, 1K-S, 1K-L**: 1K user tests (150 VUs) - All passed across all data volumes

### ❌ FAILED Tests

- **10K-1, 10K-S, 10K-L**: 10K user tests (1,500 VUs) - All failed across all data volumes

### Key Observations

- **150 VUs**: Consistently passes performance thresholds
- **1,500 VUs**: Consistently fails performance thresholds
- **Data volume**: Minimal impact on 10K user test performance
- **Error patterns**: All 10K failures show similar p95 latency (~10-11s) and low error rates (0.10-0.14%)
