#!/usr/bin/env node

/**
 * GitHub Dashboard Performance Testing Script
 * 
 * This script helps estimate resource requirements by:
 * 1. Generating realistic demo data
 * 2. Testing API performance under load
 * 3. Measuring memory and CPU usage
 * 4. Estimating database storage needs
 */

const os = require('os');
const { performance } = require('perf_hooks');

// Configuration for different scenarios
const SCENARIOS = {
  small: {
    users: 1000,
    dashboardsPerUser: 3,
    activitiesPerDashboard: 50,
    description: "1K users scenario"
  },
  large: {
    users: 10000,
    dashboardsPerUser: 5,
    activitiesPerDashboard: 100,
    description: "10K users scenario"
  }
};

class PerformanceTester {
  constructor() {
    this.startTime = performance.now();
    this.memoryUsage = process.memoryUsage();
    this.cpuUsage = process.cpuUsage();
  }

  // Generate realistic demo data estimates based on actual schema
  generateDataEstimates(scenario) {
    console.log(`\n📊 Data Estimates for ${scenario.description}:`);
    console.log("=" .repeat(50));
    
    const { users, dashboardsPerUser, activitiesPerDashboard } = scenario;
    
    // Calculate data volumes based on actual schema
    const totalDashboards = users * dashboardsPerUser;
    const totalActivities = totalDashboards * activitiesPerDashboard;
    
    // Estimate storage based on actual entity sizes (from schema analysis)
    const clientRecordSize = 150; // bytes per client record (uuid + name + tier_type_id + logo_url + timestamps)
    const dashboardRecordSize = 400; // bytes per dashboard (uuid + name + slug + description + client_id + dashboard_type_id + timestamps)
    const githubUserRecordSize = 300; // bytes per github_user (uuid + github_user_id + username + display_name + avatar_url + profile_url + timestamps)
    const dashboardActivityConfigSize = 100; // bytes per config (uuid + dashboard_id + activity_type_id + timestamp)
    const dashboardGitHubUserSize = 100; // bytes per dashboard-user link (uuid + dashboard_id + github_user_id + timestamp)
    const dashboardRepositorySize = 100; // bytes per dashboard-repo link (uuid + dashboard_id + repository_id + timestamp)
    
    // Calculate storage for each entity type
    const clientStorage = users * clientRecordSize; // 1 client per user (tenant model)
    const dashboardStorage = totalDashboards * dashboardRecordSize;
    const githubUserStorage = users * 5 * githubUserRecordSize; // Assume 5 GitHub users per client
    const activityConfigStorage = totalDashboards * 3 * dashboardActivityConfigSize; // 3 activity types per dashboard
    const dashboardUserLinksStorage = totalDashboards * 5 * dashboardGitHubUserSize; // 5 users per dashboard
    const dashboardRepoLinksStorage = totalDashboards * 3 * dashboardRepositorySize; // 3 repos per dashboard
    
    const totalStorage = clientStorage + dashboardStorage + githubUserStorage + 
                        activityConfigStorage + dashboardUserLinksStorage + dashboardRepoLinksStorage;
    
    console.log(`👥 Clients: ${users.toLocaleString()}`);
    console.log(`📊 Dashboards: ${totalDashboards.toLocaleString()}`);
    console.log(`👤 GitHub Users: ${(users * 5).toLocaleString()}`);
    console.log(`⚙️  Activity Configs: ${(totalDashboards * 3).toLocaleString()}`);
    console.log(`💾 Estimated Storage:`);
    console.log(`   - Clients: ${this.formatBytes(clientStorage)}`);
    console.log(`   - Dashboards: ${this.formatBytes(dashboardStorage)}`);
    console.log(`   - GitHub Users: ${this.formatBytes(githubUserStorage)}`);
    console.log(`   - Activity Configs: ${this.formatBytes(activityConfigStorage)}`);
    console.log(`   - Dashboard-User Links: ${this.formatBytes(dashboardUserLinksStorage)}`);
    console.log(`   - Dashboard-Repo Links: ${this.formatBytes(dashboardRepoLinksStorage)}`);
    console.log(`   - Total: ${this.formatBytes(totalStorage)}`);
    
    return {
      users,
      totalDashboards,
      totalActivities,
      totalStorage,
      breakdown: {
        clientStorage,
        dashboardStorage,
        githubUserStorage,
        activityConfigStorage,
        dashboardUserLinksStorage,
        dashboardRepoLinksStorage
      }
    };
  }

  // Simulate API load testing
  async simulateApiLoad(requests = 100) {
    console.log(`\n🚀 Simulating ${requests} API requests...`);
    
    const startTime = performance.now();
    const memoryBefore = process.memoryUsage();
    
    // Simulate API calls (replace with actual API calls)
    const promises = [];
    for (let i = 0; i < requests; i++) {
      promises.push(this.simulateApiCall());
    }
    
    await Promise.all(promises);
    
    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();
    
    const duration = endTime - startTime;
    const requestsPerSecond = Math.round((requests / duration) * 1000);
    const memoryDelta = memoryAfter.heapUsed - memoryBefore.heapUsed;
    
    console.log(`⏱️  Duration: ${duration.toFixed(2)}ms`);
    console.log(`📈 Requests/sec: ${requestsPerSecond}`);
    console.log(`🧠 Memory delta: ${this.formatBytes(memoryDelta)}`);
    
    return {
      duration,
      requestsPerSecond,
      memoryDelta
    };
  }

  // Simulate a single API call
  async simulateApiCall() {
    // Simulate database query time
    const queryTime = Math.random() * 50 + 10; // 10-60ms
    await new Promise(resolve => setTimeout(resolve, queryTime));
    
    // Simulate JSON processing
    const data = { 
      id: Math.random(), 
      timestamp: Date.now(),
      activities: Array.from({length: 10}, () => ({
        id: Math.random(),
        type: 'pull_request',
        action: 'opened'
      }))
    };
    
    return JSON.stringify(data);
  }

  // Estimate infrastructure requirements
  estimateInfrastructure(scenario, performanceData) {
    console.log(`\n🏗️  Infrastructure Estimates for ${scenario.description}:`);
    console.log("=" .repeat(50));
    
    const { users, totalActivities } = scenario;
    const { requestsPerSecond } = performanceData;
    
    // Estimate concurrent users (10% of total users active at peak)
    const concurrentUsers = Math.ceil(users * 0.1);
    const peakRequestsPerSecond = Math.ceil(concurrentUsers * 2); // 2 requests per user per second
    
    // Estimate CPU requirements
    const cpuPerRequest = 0.1; // 0.1 CPU cores per request
    const estimatedCpu = Math.ceil(peakRequestsPerSecond * cpuPerRequest);
    
    // Estimate memory requirements
    const memoryPerUser = 2; // 2MB per active user
    const baseMemory = 512; // 512MB base memory
    const estimatedMemory = Math.ceil((concurrentUsers * memoryPerUser) + baseMemory);
    
    // Estimate database requirements
    const dbConnections = Math.ceil(concurrentUsers * 0.5); // 0.5 connections per user
    const dbStorage = this.estimateDatabaseStorage(scenario);
    
    console.log(`👥 Concurrent Users: ${concurrentUsers.toLocaleString()}`);
    console.log(`📈 Peak RPS: ${peakRequestsPerSecond.toLocaleString()}`);
    console.log(`🖥️  Estimated CPU: ${estimatedCpu} cores`);
    console.log(`🧠 Estimated Memory: ${this.formatBytes(estimatedMemory * 1024 * 1024)}`);
    console.log(`🗄️  DB Connections: ${dbConnections}`);
    console.log(`💾 DB Storage: ${this.formatBytes(dbStorage)}`);
    
    return {
      concurrentUsers,
      peakRequestsPerSecond,
      estimatedCpu,
      estimatedMemory,
      dbConnections,
      dbStorage
    };
  }

  // Estimate database storage needs
  estimateDatabaseStorage(scenario) {
    const { users, totalActivities } = scenario;
    
    // Base storage for schema, indexes, etc.
    const baseStorage = 100 * 1024 * 1024; // 100MB
    
    // User data
    const userStorage = users * 500; // 500 bytes per user
    
    // Activity data (largest component)
    const activityStorage = totalActivities * 400; // 400 bytes per activity
    
    // Indexes and overhead (30% of data)
    const overhead = (userStorage + activityStorage) * 0.3;
    
    return baseStorage + userStorage + activityStorage + overhead;
  }

  // Format bytes to human readable
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Run all tests
  async runTests() {
    console.log("🧪 GitHub Dashboard Performance Testing");
    console.log("=" .repeat(50));
    
    const results = {};
    
    for (const [scenarioName, scenario] of Object.entries(SCENARIOS)) {
      console.log(`\n🔍 Testing ${scenario.description}...`);
      
      // Generate data estimates
      const dataEstimates = this.generateDataEstimates(scenario);
      
      // Run performance test
      const performanceData = await this.simulateApiLoad(50);
      
      // Estimate infrastructure
      const infrastructureEstimates = this.estimateInfrastructure(scenario, performanceData);
      
      results[scenarioName] = {
        scenario,
        dataEstimates,
        performanceData,
        infrastructureEstimates
      };
    }
    
    // Generate cost estimates
    this.generateCostEstimates(results);
    
    return results;
  }

  // Generate cost estimates based on infrastructure requirements
  generateCostEstimates(results) {
    console.log(`\n💰 Cost Estimates:`);
    console.log("=" .repeat(50));
    
    for (const [scenarioName, result] of Object.entries(results)) {
      const { scenario, infrastructureEstimates } = result;
      
      console.log(`\n📊 ${scenario.description}:`);
      
      // EKS costs (per month)
      const eksControlPlane = 73; // $73/month for EKS control plane
      const nodeCost = infrastructureEstimates.estimatedCpu * 0.10 * 24 * 30; // $0.10/hour per CPU
      
      // Aurora costs (per month)
      const auroraCost = infrastructureEstimates.dbConnections * 0.20 * 24 * 30; // $0.20/hour per connection
      
      // S3 costs (per month)
      const s3Storage = infrastructureEstimates.dbStorage * 0.023 / 1024 / 1024 / 1024; // $0.023/GB
      
      // ALB costs (per month)
      const albCost = 22.5; // $22.50/month base + $0.008 per LCU-hour
      
      const totalCost = eksControlPlane + nodeCost + auroraCost + s3Storage + albCost;
      
      console.log(`   - EKS Control Plane: $${eksControlPlane}/month`);
      console.log(`   - Compute Nodes: $${nodeCost.toFixed(2)}/month`);
      console.log(`   - Aurora Database: $${auroraCost.toFixed(2)}/month`);
      console.log(`   - S3 Storage: $${s3Storage.toFixed(2)}/month`);
      console.log(`   - Application Load Balancer: $${albCost}/month`);
      console.log(`   - Total Estimated: $${totalCost.toFixed(2)}/month`);
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runTests().catch(console.error);
}

module.exports = PerformanceTester;
