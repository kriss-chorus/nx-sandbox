const { Client } = require('pg');

class TestDataCleanup {
  constructor() {
    this.client = new Client({
      host: 'localhost',
      port: 5432,
      database: 'github_dashboard',
      user: 'postgres',
      password: 'password'
    });
  }

  async connect() {
    await this.client.connect();
    console.log('Connected to database');
  }

  async cleanup() {
    console.log('🧹 Cleaning up test data...');
    
    // First, delete activities for test dashboards (before deleting dashboards)
    const testActivities = await this.client.query(`
      DELETE FROM dashboard_github_user 
      WHERE dashboard_id IN (
        SELECT id FROM dashboard WHERE name LIKE 'Test Dashboard %' OR name LIKE 'Dashboard %'
      )
    `);
    console.log(`Deleted ${testActivities.rowCount} test activities`);
    
    // Then delete test dashboards
    const testDashboards = await this.client.query(
      "DELETE FROM dashboard WHERE name LIKE 'Test Dashboard %' OR name LIKE 'Dashboard %' RETURNING id"
    );
    console.log(`Deleted ${testDashboards.rows.length} test dashboards`);
    
    // Clean up test GitHub users
    const testUsers = await this.client.query(
      "DELETE FROM github_user WHERE github_username LIKE 'github_user%' RETURNING id"
    );
    console.log(`Deleted ${testUsers.rows.length} test users`);
    
    console.log('✅ Test data cleanup completed');
  }

  async disconnect() {
    await this.client.end();
    console.log('Disconnected from database');
  }
}

async function main() {
  const cleanup = new TestDataCleanup();
  
  try {
    await cleanup.connect();
    await cleanup.cleanup();
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await cleanup.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = TestDataCleanup;
