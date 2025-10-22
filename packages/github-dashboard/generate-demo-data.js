#!/usr/bin/env node

/**
 * Generate realistic demo data for GitHub Dashboard performance testing
 * Based on actual database schema and seeded data
 */

const { Client } = require('pg');

class DemoDataGenerator {
  constructor() {
    this.client = new Client({
      host: 'localhost',
      port: 5432,
      database: 'github_dashboard',
      user: 'postgres',
      password: 'password'
    });
    
    this.clients = [];
    this.githubUsers = [];
    this.dashboards = [];
    this.activities = [];
  }

  async connect() {
    await this.client.connect();
    console.log('Connected to database');
  }

  async disconnect() {
    await this.client.end();
    console.log('Disconnected from database');
  }

  async getExistingData() {
    // Get existing clients (we'll use these)
    const clientResult = await this.client.query('SELECT id, name FROM client');
    this.clients = clientResult.rows;
    console.log(`Found ${this.clients.length} existing clients`);

    // Get existing dashboard types
    const dashboardTypeResult = await this.client.query('SELECT id, name FROM dashboard_type');
    this.dashboardTypes = dashboardTypeResult.rows;
    console.log(`Found ${this.dashboardTypes.length} dashboard types`);
  }

  async generateGitHubUsers(count) {
    console.log(`Generating ${count} GitHub users...`);
    
    // Check existing count
    const existingCount = await this.client.query('SELECT COUNT(*) FROM github_user WHERE github_username LIKE \'github_user%\'');
    const currentCount = parseInt(existingCount.rows[0].count);
    
    if (currentCount >= count) {
      console.log(`Already have ${currentCount} GitHub users, skipping generation`);
      // Load existing users for activities generation
      const existingUsers = await this.client.query('SELECT id FROM github_user WHERE github_username LIKE \'github_user%\' ORDER BY github_username');
      this.githubUsers = existingUsers.rows;
      return;
    }
    
    const remainingCount = count - currentCount;
    console.log(`Found ${currentCount} existing users, generating ${remainingCount} more...`);
    
    const githubUsers = [];
    for (let i = currentCount; i < count; i++) {
      const githubUser = {
        id: this.generateUUID(),
        github_user_id: `${10000 + i}`,
        github_username: `github_user_${i + 1}`,
        display_name: `GitHub User ${i + 1}`,
        avatar_url: `https://avatars.githubusercontent.com/u/${1000 + i}`,
        profile_url: `https://github.com/github_user_${i + 1}`,
        created_at: new Date(),
        updated_at: new Date()
      };
      githubUsers.push(githubUser);
    }

    // Insert GitHub users
    const insertQuery = `
      INSERT INTO github_user (id, github_user_id, github_username, display_name, avatar_url, profile_url, created_at, updated_at)
      VALUES ${githubUsers.map((_, i) => 
        `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`
      ).join(', ')}
    `;
    
    const values = githubUsers.flatMap(user => [
      user.id, user.github_user_id, user.github_username, user.display_name, user.avatar_url, user.profile_url, user.created_at, user.updated_at
    ]);
    
    await this.client.query(insertQuery, values);
    this.githubUsers = githubUsers;
    console.log(`Generated ${count} GitHub users`);
  }

  async generateDashboards(count) {
    console.log(`Generating ${count} dashboards...`);
    
    // Check existing count
    const existingCount = await this.client.query('SELECT COUNT(*) FROM dashboard WHERE name LIKE \'Dashboard %\'');
    const currentCount = parseInt(existingCount.rows[0].count);
    
    if (currentCount >= count) {
      console.log(`Already have ${currentCount} dashboards, skipping generation`);
      // Load existing dashboards for activities generation
      const existingDashboards = await this.client.query('SELECT id FROM dashboard WHERE name LIKE \'Dashboard %\' ORDER BY name');
      this.dashboards = existingDashboards.rows;
      return;
    }
    
    const remainingCount = count - currentCount;
    console.log(`Found ${currentCount} existing dashboards, generating ${remainingCount} more...`);
    
    const dashboards = [];
    for (let i = currentCount; i < count; i++) {
      const client = this.clients[i % this.clients.length];
      const dashboardType = this.dashboardTypes[i % this.dashboardTypes.length];
      
      const dashboard = {
        id: this.generateUUID(),
        name: `Dashboard ${i + 1}`,
        slug: `dashboard-${i + 1}`,
        client_id: client.id,
        dashboard_type_id: dashboardType.id,
        created_at: new Date(),
        updated_at: new Date()
      };
      dashboards.push(dashboard);
    }

    // Insert dashboards
    const insertQuery = `
      INSERT INTO dashboard (id, name, slug, client_id, dashboard_type_id, created_at, updated_at)
      VALUES ${dashboards.map((_, i) => 
        `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`
      ).join(', ')}
    `;
    
    const values = dashboards.flatMap(dashboard => [
      dashboard.id, dashboard.name, dashboard.slug, dashboard.client_id, dashboard.dashboard_type_id, dashboard.created_at, dashboard.updated_at
    ]);
    
    await this.client.query(insertQuery, values);
    this.dashboards = dashboards;
    console.log(`Generated ${count} dashboards`);
  }

  async generateActivities(count) {
    console.log(`Generating ${count} activities...`);
    
    // Check existing count
    const existingCount = await this.client.query('SELECT COUNT(*) FROM dashboard_github_user');
    const currentCount = parseInt(existingCount.rows[0].count);
    
    if (currentCount >= count) {
      console.log(`Already have ${currentCount} activities, skipping generation`);
      return;
    }
    
    const remainingCount = count - currentCount;
    console.log(`Found ${currentCount} existing activities, generating ${remainingCount} more...`);
    
    const activities = [];
    const usedCombinations = new Set();
    
    for (let i = currentCount; i < count; i++) {
      let dashboard, githubUser, combination;
      let attempts = 0;
      
      // Try to find a unique combination
      do {
        dashboard = this.dashboards[Math.floor(Math.random() * this.dashboards.length)];
        githubUser = this.githubUsers[Math.floor(Math.random() * this.githubUsers.length)];
        combination = `${dashboard.id}-${githubUser.id}`;
        attempts++;
      } while (usedCombinations.has(combination) && attempts < 100);
      
      if (attempts >= 100) {
        console.log(`Warning: Could not find unique combination after 100 attempts, skipping activity ${i + 1}`);
        continue;
      }
      
      usedCombinations.add(combination);
      
      const activity = {
        id: this.generateUUID(),
        dashboard_id: dashboard.id,
        github_user_id: githubUser.id,
        added_at: new Date()
      };
      activities.push(activity);
    }

    // Insert activities (using dashboard_github_user table)
    const insertQuery = `
      INSERT INTO dashboard_github_user (id, dashboard_id, github_user_id, added_at)
      VALUES ${activities.map((_, i) => 
        `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
      ).join(', ')}
    `;
    
    const values = activities.flatMap(activity => [
      activity.id, activity.dashboard_id, activity.github_user_id, activity.added_at
    ]);
    
    await this.client.query(insertQuery, values);
    this.activities = activities;
    console.log(`Generated ${count} activities`);
  }

  async generateScenario(scenario) {
    console.log(`\n=== Generating data for ${scenario} scenario ===`);
    
    let githubUserCount, dashboardCount, activityCount;
    
    switch (scenario) {
      case 'small':
        githubUserCount = 100;
        dashboardCount = 20;
        activityCount = 500;
        break;
      case 'large':
        githubUserCount = 1000;
        dashboardCount = 100;
        activityCount = 5000;
        break;
      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }

    await this.generateGitHubUsers(githubUserCount);
    await this.generateDashboards(dashboardCount);
    await this.generateActivities(activityCount);
    
    console.log(`\n✅ Completed ${scenario} scenario generation:`);
    console.log(`   - ${githubUserCount} GitHub users`);
    console.log(`   - ${dashboardCount} dashboards`);
    console.log(`   - ${activityCount} activities`);
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async runAllScenarios() {
    try {
      await this.connect();
      await this.getExistingData();
      
      // Generate data for both scenarios
      await this.generateScenario('small');
      await this.generateScenario('large');
      
      console.log('\n🎉 All scenarios completed successfully!');
      
    } catch (error) {
      console.error('Error generating data:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// CLI interface
async function main() {
  const scenario = process.argv[2];
  const generator = new DemoDataGenerator();
  
  if (scenario && ['small', 'large'].includes(scenario)) {
    await generator.connect();
    await generator.getExistingData();
    await generator.generateScenario(scenario);
    await generator.disconnect();
  } else {
    console.log('Usage: node generate-demo-data.js [small|large]');
    console.log('Generates realistic demo data for performance testing');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DemoDataGenerator;
